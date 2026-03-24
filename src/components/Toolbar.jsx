/**
 * Toolbar – Modern dark toolbar with glass effect.
 */
export default function Toolbar({
    fileName,
    projectName,
    onPrint,
    onSaveHtml,
    annotationMode,
    onSetAnnotationMode,
    currentView,
    onEnterFocus,
}) {
    const s = {
        toolbar: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)',
            fontFamily: 'var(--font-sans)',
            flexWrap: 'wrap',
        },
        btn: (active) => ({
            padding: '7px 14px',
            fontSize: '12px',
            fontWeight: 500,
            border: '1px solid ' + (active ? 'var(--color-accent)' : 'var(--color-border)'),
            background: active ? 'var(--color-accent)' : 'var(--color-surface-2)',
            color: active ? 'white' : 'var(--color-text-secondary)',
            cursor: 'pointer',
            borderRadius: '8px',
            transition: 'all 0.2s ease',
            fontFamily: 'var(--font-sans)',
        }),
    }

    return (
        <div style={s.toolbar} className="no-print">
            {/* File info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                {fileName ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '14px', color: 'var(--color-text)', fontWeight: 600 }}>
                            {fileName}
                        </span>
                        {projectName && (
                            <span style={{
                                fontSize: '11px',
                                color: 'var(--color-text-muted)',
                                background: 'var(--color-surface-3)',
                                padding: '2px 8px',
                                borderRadius: '12px',
                            }}>
                                📂 {projectName}
                            </span>
                        )}
                    </div>
                ) : (
                    <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                        Chưa mở tài liệu
                    </span>
                )}
            </div>

            {/* Actions */}
            <button
                onClick={() => onSetAnnotationMode(annotationMode === 'highlight' ? 'off' : 'highlight')}
                style={s.btn(annotationMode === 'highlight')}
                disabled={!fileName}
                title="Highlight text"
            >
                🖍️ Highlight
            </button>

            <button
                onClick={() => onSetAnnotationMode(annotationMode === 'draw' ? 'off' : 'draw')}
                style={s.btn(annotationMode === 'draw')}
                disabled={!fileName}
                title="Draw / Annotate"
            >
                ✏️ Vẽ
            </button>

            <button onClick={onEnterFocus} style={s.btn(false)} disabled={!fileName} title="Focus mode (F)">
                📖 Focus
            </button>

            <div style={{ width: '1px', height: '24px', background: 'var(--color-border)', margin: '0 4px' }} />

            <button onClick={onPrint} style={s.btn(false)} disabled={!fileName} title="In PDF">
                🖨️
            </button>
            <button onClick={onSaveHtml} style={s.btn(false)} disabled={!fileName} title="Lưu HTML">
                💾
            </button>
        </div>
    )
}
