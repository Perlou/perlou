/**
 * utils
 * @author Perlou(perloukevin@gmail.com)
 */

import path from 'path'
import fs from 'fs-extra'
import { OUTPUT_DIR } from './constants.js'

export const thousands = (number: number): string => {
    var str = number.toString()
    var reg = str.indexOf('.') > -1 ? /(\d)(?=(\d{3})+\.)/g : /(\d)(?=(?:\d{3})+$)/g
    return str.replace(reg, '$1,')
}

export const jsonStringify = (data: unknown): string => {
    return JSON.stringify(data, null, 2)
}

export const writeFileToOutput = (fileName: string, fileData: string): void => {
    return fs.writeFileSync(path.resolve(OUTPUT_DIR, fileName), fileData)
}

export const writeJSONToOutput = (fileName: string, jsonData: unknown): void => {
    return writeFileToOutput(fileName, jsonStringify(jsonData))
}

export const consoleObject = (title: string, object: unknown): void => {
    return console.log(title, JSON.stringify(object, null, 2))
}
