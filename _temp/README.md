## About ##

A temporary folder containing scripts used for transforming ```PersName database.xlsx``` file into a valid TEI file holding ```persName``` definitions.

## Usage ##

1. Copy the ```PersName database.xlsx``` to this folder.
1. Run ```yarn install``` to add all dependencies.
1. Execute ```node ./01-create-pers-name-file.js``` to create a TEI definition file.
1. Execute ```node ./02-replace-refs.js``` to adjust all TEI references so that they pointed to the newly created file.
1. *(optional)* Adjust indents and formatting (e.g. using [Oxygen XML Editor](https://web.archive.org/web/20240930134941/https://www.oxygenxml.com/doc/versions/26.1/ug-editor/topics/format-indent-multiple-files-x-tools.html))
