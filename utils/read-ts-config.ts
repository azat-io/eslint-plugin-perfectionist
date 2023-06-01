import json5 from 'json5'
import path from 'path'
import fs from 'fs'

export class TSConfig {
  private static _instance?: {
    compilerOptions?: {
      paths?: {
        [key: string]: string
      }
    }
  }

  public static get() {
    if (this._instance) {
      return this._instance
    }

    this._instance = json5.parse(
      fs.readFileSync(path.resolve(process.cwd(), 'tsconfig.json'), 'utf8'),
    )

    return this._instance
  }
}
