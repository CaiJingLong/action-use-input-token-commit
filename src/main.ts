import * as core from '@actions/core'
import {context} from '@actions/github'
import shelljs from 'shelljs'

function doIt(): void {
  const comment = context.payload?.comment
  const commentBody = comment?.body
  const commmentAuthor = context.actor
  const htmlUrl = comment?.html_url

  if (!commentBody) {
    throw new Error('No comment body found')
  }

  const writeText = `
  ## Comment from ${commmentAuthor}

  ${commentBody}

  origin: [comment](${htmlUrl})

`

  const token = core.getInput('github-token', {required: true})

  const result = shelljs.exec(`
  echo "${writeText}" >> README.md
  git config --global user.email "github-actions[bot]@users.noreply.github.com"
  git config --global user.name "github-actions[bot]"
  git add README.md
  git commit -m "Update by ${commmentAuthor} on ${htmlUrl}"
  
  git config --global credential.helper "store --file=.git/credentials"
  echo "https://x-access-token:${token}@github.com" > .git/credentials

  git push origin main
`)

  if (result.code !== 0) {
    throw new Error(result.stderr)
  }
}

function checkEnv(): void {
  if (!shelljs.which('gh')) {
    throw new Error('gh cli not found')
  }

  if (!shelljs.which('git')) {
    throw new Error('git cli not found')
  }
}

async function run(): Promise<void> {
  try {
    checkEnv()
    core.debug(`context: ${JSON.stringify(context, undefined, 2)}`)
    doIt()
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
