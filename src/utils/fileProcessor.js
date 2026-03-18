/**
 * File Processor – Handles .md and .docx file parsing
 */
import mammoth from 'mammoth'

/**
 * Detect file type from File object
 * @param {File} file
 * @returns {'md' | 'docx' | null}
 */
export function detectFileType(file) {
    const name = file.name.toLowerCase()
    if (name.endsWith('.md') || name.endsWith('.markdown')) return 'md'
    if (name.endsWith('.docx')) return 'docx'
    return null
}

/**
 * Process a markdown file – returns raw text
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function processMarkdown(file) {
    return await file.text()
}

/**
 * Process a .docx file – returns HTML string
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function processDocx(file) {
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.convertToHtml({ arrayBuffer })
    return result.value
}

/**
 * Unified file processor
 * @param {File} file
 * @returns {Promise<{ type: 'md' | 'docx', content: string, fileName: string }>}
 */
export async function processFile(file) {
    const type = detectFileType(file)
    if (!type) {
        throw new Error(`Unsupported file type: ${file.name}. Please use .md or .docx files.`)
    }

    let content
    if (type === 'md') {
        content = await processMarkdown(file)
    } else {
        content = await processDocx(file)
    }

    return { type, content, fileName: file.name }
}
