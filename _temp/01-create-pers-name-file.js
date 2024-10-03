const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const xlsx = require('node-xlsx')
const cheerio = require('cheerio')
const formatXML = require('xml-formatter')

const { PATHS, FORMATTING } = require('./_constants')

/**
 * Helper function for normalising text by e.g. removing non-standard white-spaces.
 * @param {undefined | string} date
 */
const normaliseText = (text = '') => text.replace(/\s/g,' ')

/**
 * Helper function for normalising date in the ISO format.
 * @param {undefined | string} date
 */
const normaliseDate = (date = '') => {
  if (!date) return date
  const components = date.split('-').filter(Boolean)
  components[0] = components[0].padStart(4, '0')
  return components.join('-')
}

/**
 * Helper function for extracting URLs from the text.
 * @param {undefined | string} note
 */
const getURLs = (note = '') => {
  return note.match(/https?:\/\/[^\s]+/gi) || []
}

/**
 * Manually escapes XML special characters.
 * @param {undefined | string} note
 */
const escape = (text = '', allowQuotes = true) => text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

/**
 * Manually escapes XML special characters for attributes.
 * @param {undefined | string} note
 */
const escapeAttribute = (text) => escape(text)
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;')

/**
 * Script definition.
 */
;(async() => {
  // Load XLSX file.
  console.log(`Opening the "${PATHS.INPUT}" file.`)
  const fileDefinition = xlsx.parse(PATHS.INPUT)

  // Get data from the first sheet.
  console.log(`Parsing the XLSX file.`)
  const { data: [header, ...entries] } = fileDefinition[0]
  console.log(`Found ${entries.length} entries.`)

  // Create an empty TEI XML file in the memory.
  const $ = cheerio.load(`
    <TEI xmlns="http://www.tei-c.org/ns/1.0">
      <teiHeader>
        <fileDesc>
          <titleStmt>
            <title>People Metadata</title>
          </titleStmt>
          <publicationStmt>
            <p>File created by Evolving Hands project, Newcastle University</p>
          </publicationStmt>
          <sourceDesc>
            <p>Metadata file containing information about people referenced in the project</p>
          </sourceDesc>
        </fileDesc>
      </teiHeader>
      <standOff>
        <listPerson>
        </listPerson>
      </standOff>
    </TEI>
  `, { xmlMode: true, decodeEntities: false })
  const $list = $('listPerson')

  // Map entries one by one based on the columns order.
  for (const entry of entries) {
    // Trim the trailing spaces and desctructure the row.
    const [
      idno,
      , // Not in use
      rawPersName,
      rawFirstName,
      death,
      deathNotBefore,
      deathNotAfter,
      birth,
      birthNotBefore,
      birthNotAfter,
      rawLastName,
      , // Not in use
      viaf,
      note,
      sourceNote,
    ] = entry.map(value => `${value}`.trim())
    console.log(`\tProcessing: ${idno} entry.`)

    // Normalise text nodes.
    const [
      persName,
      firstName,
      lastName,
    ] = [
      rawPersName,
      rawFirstName,
      rawLastName,
    ].map(normaliseText)

    // Create a <person> tag wrapper.
    const $person = $('<person>')
    $person.attr('xml:id', `person-${idno}`)

    // Resolve the <idno> tag.
    if (viaf) {
      const $note = $('<idno>')
      $note.attr('type', 'VIAF')
      $note.text(escape(viaf))
      $note.appendTo($person)
    }

    // Resolve the <persName> tag.
    const $persName = $('<persName>')
    $persName.text(escape(persName))
    $persName.appendTo($person)

    // Resolve the <forename> tag.
    $persName.html($persName.html().replace(firstName, `<forename>${firstName}</forename>`))

    // Resolve the <surname> tag.
    $persName.html($persName.html().replace(lastName, `<surname>${lastName}</surname>`))

    // Resolve the <birth> tag.
    if (birth || birthNotBefore || birthNotAfter) {
      const $birth = $('<birth>')
      if (birth) $birth.attr('when', normaliseDate(birth))
      if (birthNotBefore) $birth.attr('notBefore', normaliseDate(birthNotBefore))
      if (birthNotAfter) $birth.attr('notAfter', normaliseDate(birthNotAfter))
      $birth.appendTo($person)
    }

    // Resolve the <death> tag.
    if (death || deathNotBefore || deathNotAfter) {
      const $death = $('<death>')
      if (death) $death.attr('when', normaliseDate(death))
      if (deathNotBefore) $death.attr('notBefore', normaliseDate(deathNotBefore))
      if (deathNotAfter) $death.attr('notAfter', normaliseDate(deathNotAfter))
      $death.appendTo($person)
    }

    // Resolve <note> tag.
    if (note) {
      const $note = $('<note>')
      const $p = $('<p>')
      $p.text(note)
      $p.appendTo($note)
      $note.appendTo($person)
    }

    // Resolve <ptr> tags.
    [viaf ? `http://viaf.org/viaf/${viaf}` : '', ...getURLs(sourceNote)].filter(Boolean).forEach(url => {
      const $ptr = $('<ptr>')
      $ptr.attr('target', escapeAttribute(url))
      $ptr.appendTo($person)
    })

    // Append the person to the list.
    $person.appendTo($list)
  }

  // Format and save the TEI file.
  console.log(`Saving process data to "${PATHS.OUTPUT}".`)
  const formattedContent = formatXML($.html(), { indentation: FORMATTING.INDENT })
  await promisify(fs.mkdir)(path.dirname(PATHS.OUTPUT), { recursive: true })
  await promisify(fs.writeFile)(PATHS.OUTPUT, formattedContent)
})()
