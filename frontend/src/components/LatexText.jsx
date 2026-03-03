import { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * LatexText — Renders a string that may contain inline LaTeX ($...$) or
 * display LaTeX ($$...$$) as rendered math via KaTeX.
 *
 * Usage: <LatexText text="Find $\alpha + \beta$ if..." className="text-white" />
 */
export default function LatexText({ text, className = '' }) {
    const html = useMemo(() => {
        if (!text) return '';

        // Replace display math first ($$...$$), then inline ($...$)
        let result = text;

        // Display math: $$...$$ → rendered block
        result = result.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => {
            try {
                return katex.renderToString(tex.trim(), {
                    displayMode: true,
                    throwOnError: false,
                    trust: true,
                });
            } catch {
                return `$$${tex}$$`;
            }
        });

        // Inline math: $...$ (but not $$)
        result = result.replace(/\$([^\$]+?)\$/g, (_, tex) => {
            try {
                return katex.renderToString(tex.trim(), {
                    displayMode: false,
                    throwOnError: false,
                    trust: true,
                });
            } catch {
                return `$${tex}$`;
            }
        });

        return result;
    }, [text]);

    return (
        <span
            className={className}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
