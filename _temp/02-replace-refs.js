const { glob } = require('glob')
const fs = require('fs')
const path = require('path')
const { promisify } = require('util')

const { PATHS } = require('./_constants')

/**
 * Script definition.
 */
;(async() => {
  // Find all TEI files to replace.
  const dir = `${PATHS.ROOT}/GB-*.xml`
  console.log(`Finding relevant TEI files in the "${dir}" path.`)
  const queue = await glob(dir, { absolute: true })
  console.log(`Found ${queue.length} files.`)

  // Process each file.
  for (const filepath of queue) {
    // Create the file buffer.
    console.log(`Opening the "${filepath}" file.`)
    const file = await promisify(fs.readFile)(filepath);
    let content = file.toString()

    // Determine UNIX-style path to the person database to the TEI file.
    const dbURL = path.relative(path.dirname(filepath), PATHS.OUTPUT).replace(/\\/g,'/')

    // Remove the <listPerson> tag.
    content = content.replace(/\s+<listPerson>(\s|\S)*<\/listPerson>/gi, '')

    // Update all the person refs.
    content = content.replace(/ref="#person-/gi, `ref="${dbURL}#person-`)

    // Save the TEI file.
    console.log(`Saving process data to "${PATHS.OUTPUT}".`)
    await promisify(fs.writeFile)(filepath, content)
  }
})()
