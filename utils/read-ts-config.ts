import json5 from 'json5'
import path from 'path'
import fs from 'fs'

export let readTSConfig = () =>
  json5.parse(
    fs.readFileSync(path.resolve(process.cwd(), 'tsconfig.json'), 'utf8'),
  )
