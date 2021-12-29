import {spawn} from 'child_process'

describe('works', () => {
  const suffixes = {darwin: 'macos', linux: 'linux', win32: 'win'}

  it('works', async () => {
    const server = spawn(`./bin/eyes-universal-${suffixes[process.platform]}`, {
      detached: true,
      shell: process.platform === 'win32' ? 'C:\\Program Files\\Git\\bin\\bash.exe' : '/bin/bash',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    return new Promise<void>((resolve, reject) => {
      server.on('error', reject)

      const timeout = setTimeout(() => reject(new Error('No output from the server for 10 seconds')), 10000)
      server.stdout.once('data', data => {
        clearTimeout(timeout)
        const [firstLine] = String(data).split('\n', 1)
        if (Number.isInteger(Number(firstLine))) {
          resolve()
        } else {
          reject(new Error(`Server first line of stdout output expected to be a port, but got "${firstLine}"`))
        }
      })
    }).finally(() => server.kill())
  })
})
