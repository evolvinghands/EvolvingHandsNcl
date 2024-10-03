const path = require('path')

const TEMP_PATH = __dirname
const ROOT_PATH = path.resolve(TEMP_PATH, '..')

module.exports = {
  PATHS: {
    TEMP: TEMP_PATH,
    ROOT: ROOT_PATH,
    INPUT: path.join(TEMP_PATH, './PersName database.xlsx'),
    OUTPUT: path.join(ROOT_PATH, './metadata/people.xml'),
  },
  FORMATTING: {
    INDENT: '    ',
  }
}
