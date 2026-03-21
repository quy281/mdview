/**
 * File Processor – Handles .md, .docx, and .html file parsing
 */
import mammoth from 'mammoth'

/**
 * Detect file type from File object
 * @param {File} file
 * @returns {'md' | 'docx' | 'html' | null}
 */
export function detectFileType(file) {
    const name = file.name.toLowerCase()
    if (name.endsWith('.md') || name.endsWith('.markdown')) return 'md'
    if (name.endsWith('.docx')) return 'docx'
    if (name.endsWith('.html') || name.endsWith('.htm')) return 'html'
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
 * Process an HTML file – returns raw HTML string
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function processHtml(file) {
    const text = await file.text()
    // Extract body content if full HTML document
    const bodyMatch = text.match(/<body[^>]*>([\s\S]*)<\/body>/i)
    return bodyMatch ? bodyMatch[1] : text
}

/**
 * Unified file processor
 * @param {File} file
 * @returns {Promise<{ type: 'md' | 'docx' | 'html', content: string, fileName: string }>}
 */
export async function processFile(file) {
    const type = detectFileType(file)
    if (!type) {
        throw new Error(`Không hỗ trợ: ${file.name}. Vui lòng dùng .md, .docx hoặc .html`)
    }

    let content
    if (type === 'md') {
        content = await processMarkdown(file)
    } else if (type === 'docx') {
        content = await processDocx(file)
    } else {
        content = await processHtml(file)
    }

    return { type, content, fileName: file.name }
}
