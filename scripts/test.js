//@flow
/* eslint no-console: 0 */

import {child_process, fs, os, path} from 'flow-typed/dist/lib/node.js';
import {recursiveRmdir} from 'flow-typed/dist/lib/fileUtils.js';
import {gitHubClient} from 'flow-typed/dist/lib/github.js';
import got from 'got';
import * as semver from 'semver';
import * as unzip from 'unzipper';
import {peerDependencies} from '../package.json';

const PKG_ROOT_DIR = path.join(__dirname, '..');
const BIN_DIR = path.join(PKG_ROOT_DIR, 'scripts', '.flow-bins-cache');
const TEST_DIR = path.join(PKG_ROOT_DIR, 'test');
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || 5);
const P = Promise;

const BIN_PLATFORM = (_ => {
  switch (os.type()) {
    case 'Linux':
      return 'linux64';
    case 'Darwin':
      return 'osx';
    case 'Windows_NT':
      return 'win64';
    default:
      throw new Error('Unsupported os.type()! ' + os.type());
  }
})();

getOrderedFlowBinVersions().then(runFlowTypeDefTests).then(printErrs);

function printErrs(errors) {
  if (errors.length > 0) {
    console.log('ERROR:');
    errors.forEach(err =>
      console.log(
        '* %s\n',
        err.split('\n')
          .map((line, idx) => idx === 0 ? line : '    ' + line)
          .join('\n'),
      )
    );
    process.exit(1);
  } else {
    console.log('Testing complete')
    process.exit(0);
  }
}

async function runFlowTypeDefTests(flowVersionsToRun) {
  const errors = [];
  while (flowVersionsToRun.length > 0) {
    // Run tests in batches to avoid saturation
    const testBatch = flowVersionsToRun
      .slice(0, Math.min(flowVersionsToRun.length, BATCH_SIZE))
      .map(group => (flowVersionsToRun.shift(), group));

    await P.all(
      testBatch.map(async flowVer => {
        const testRunId = ' (flow-' + flowVer + ')';
        console.log('Testing %s...', testRunId);

        const {stdErrOut, errCode, execError} = await testTypeDefinition(flowVer, TEST_DIR);

        if (execError !== null) {
          errors.push(testRunId + ': Error executing Flow process: ' + execError.stack);
        } else if (!stdErrOut.endsWith('Found 0 errors\n')) {
          errors.push(testRunId + ': Unexpected Flow errors (' + String(errCode) + '):\n\n' + stdErrOut);
        }
      }),
    );
  }
  return errors;
}

function testTypeDefinition(flowVer, testDirPath) {
  return new Promise(res => {
    const child = child_process.exec(
      [ path.join(BIN_DIR, 'flow-' + flowVer), 'check', '--strip-root', testDirPath, ].join(' ')
    );

    let stdErrOut = '';
    child.stdout.on('data', data => (stdErrOut += data));
    child.stderr.on('data', data => (stdErrOut += data));
    child.on('error', execError => res({stdErrOut, errCode: null, execError}));
    child.on('close', errCode => res({stdErrOut, errCode, execError: null}));
  });
}

let _flowBinVersionPromise = null;
async function getOrderedFlowBinVersions(numberOfReleases: number = 20): Promise<Array<string>> {
  if (!(await fs.exists(BIN_DIR))) await fs.mkdir(BIN_DIR);
  if (_flowBinVersionPromise != undefined) _flowBinVersionPromise;
  return (_flowBinVersionPromise = (async function() {
    console.log('Fetching all Flow binaries...');
    const IS_WINDOWS = os.type() === 'Windows_NT';
    const GH_CLIENT = gitHubClient();
    // We only test against the latest numberOfReleases Versions
    const QUERY_PAGE_SIZE = numberOfReleases;
    const OS_ARCH_FILTER_RE = new RegExp(`flow-${BIN_PLATFORM}`);

    let page = 0;
    const apiPayload = await GH_CLIENT.repos.listReleases({
      owner: 'facebook',
      repo: 'flow',
      page: page++,
      per_page: QUERY_PAGE_SIZE,
    });

    const flowBins = apiPayload.data
      .filter(rel => {
        if (rel.tag_name === 'v0.67.0') {
          printSkipMessage(rel.tag_name, 'https://github.com/facebook/flow/issues/5922');
          return false;
        } else if (rel.tag_name === 'v0.63.0' || rel.tag_name === 'v0.70.0') {
          printSkipMessage(rel.tag_name, 'https://github.com/flowtype/flow-typed/issues/2422');
          return false;
        } else if (semver.lt(rel.tag_name, '0.53.0')) {
          console.log('flow-typed only supports flow 0.53.0 and newer');
          return false;
        } else if (
          IS_WINDOWS &&
          (semver.eq(rel.tag_name, '0.57.0') ||
            semver.eq(rel.tag_name, '0.57.1') ||
            semver.eq(rel.tag_name, '0.57.2'))
        ) {
          // Because flow 0.57 was broken before 0.57.3 on the Windows platform, we also skip those versions when running on windows.
          return false;
        }
        return semver.satisfies(rel.tag_name, peerDependencies['flow-bin']);
      })
      .map(rel => {
        // Find the binary zip in the list of assets
        const binZip = rel.assets
          .filter(({name}) => OS_ARCH_FILTER_RE.test(name) && !/-latest.zip$/.test(name))
          .map(asset => asset.browser_download_url);

        if (binZip.length !== 1) {
          throw new Error(
            'Unexpected number of ' + BIN_PLATFORM +
              ' assets for flow-' + rel.tag_name + '! ' + JSON.stringify(binZip),
          );
        } else {
          const version = rel.tag_name[0] === 'v' ? rel.tag_name : 'v' + rel.tag_name;
          return {version, binURL: binZip[0]};
        }
      })
      .sort((a, b) => semver.lt(a.version, b.version) ? -1 : 1);

    await Promise.all(
      flowBins.map(async ({version, binURL}) => {
        const zipPath = path.join(BIN_DIR, 'flow-' + version + '.zip');
        const binPath = path.join(BIN_DIR, 'flow-' + version + (IS_WINDOWS ? '.exe' : ''));
        if (await fs.exists(binPath)) return; 
        console.log("PATHS");
        console.log(zipPath);
        console.log(binPath);

        // Download the zip file
        await new Promise((res, rej) => {
          console.log('  Fetching flow-%s...', version);
          got
            .stream(binURL, {
              headers: {
                'User-Agent':
                  'flow-typed Test Runner ' +
                  '(github.com/flowtype/flow-typed)',
              },
            })
            .on('error', err => rej(err))
            .pipe(
              fs.createWriteStream(zipPath).on('close', () => {
                console.log('    flow-%s finished downloading.', version);
                res();
              }),
            );
        });

        // Extract the flow binary
        const flowBinDirPath = path.join(BIN_DIR, 'TMP-flow-' + version);
        await fs.mkdir(flowBinDirPath);
        console.log('  Extracting flow-%s...', version);
        await new Promise((res, rej) => {
          const unzipExtractor = unzip.Extract({path: flowBinDirPath});
          unzipExtractor.on('error', err => rej(err));
          unzipExtractor.on('close', () => res());
          fs.createReadStream(zipPath).pipe(unzipExtractor);
        });
        if (IS_WINDOWS) {
          await fs.rename(
            path.join(flowBinDirPath, 'flow', 'flow.exe'),
            path.join(BIN_DIR, 'flow-' + version + '.exe'),
          );
        } else {
          await fs.rename(
            path.join(flowBinDirPath, 'flow', 'flow'),
            path.join(BIN_DIR, 'flow-' + version),
          );

          await child_process.execP(['chmod', '755', path.join(BIN_DIR, 'flow-' + version)].join(' '));
        }

        console.log('  Removing flow-%s artifacts...', version);
        await P.all([recursiveRmdir(flowBinDirPath), fs.unlink(zipPath)]);
        console.log('    flow-%s complete!', version);
      }),
    );

    console.log('Finished fetching Flow binaries.\n');

    return flowBins.map(bin => bin.version);
  })());
}

function printSkipMessage(flowVersion, githubUrl) {
  console.log(
    '==========================================================================================',
  );
  console.log(`We are temporarily skipping ${flowVersion} due to ${githubUrl}`);
  console.log(
    '==========================================================================================',
  );
}
