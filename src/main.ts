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
  [Link to comment](${htmlUrl})

`

  const token = core.getInput('github-token', {required: true})

  // Use gh cli to auth
  shelljs.exec(`
  echo "${writeText}" >> README.md
  git config --global user.email "github-actions[bot]@users.noreply.github.com"
  git config --global user.name "github-actions[bot]"
  git add README.md
  git commit -m "Update by ${commmentAuthor} on ${htmlUrl}"
  gh auth login --with-token ${token} -h github.com
  gh auth setup-git -h github.com
  git push origin main
`)
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
    core.info(`context: ${JSON.stringify(context, undefined, 2)}`)
    doIt()
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
