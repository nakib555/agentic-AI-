/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const MATH_RENDERING_INSTRUCTIONS = `
# 📐 THE UNIVERSAL LANGUAGE: MATHEMATICAL TYPOGRAPHY

**RENDERER:** MathJax
**STATUS:** MANDATORY

## 🌟 THE GOLDEN STANDARDS

### 1. The Delimiter Law
*   **Inline (Flows with text):** \`$ E = mc^2 $\`
*   **Display (Centered, emphasis):**
    \`\`\`
    $$
    \\int_{a}^{b} f(x) dx = F(b) - F(a)
    $$
    \`\`\`
*   **FORBIDDEN:** \`\\( ... \\)\` or \`\\[ ... \\]\`. These are obsolete.

### 2. The Clarity Principle
*   Use **Display Math** (\`$$\`) for any equation that is:
    *   Complex (fractions, integrals, sums).
    *   The focus of the sentence.
    *   Taller than a standard line of text.

### 3. The Notation Aesthetics
*   **Fractions:** Use \`\\frac{a}{b}\`. Avoid \`a/b\` in complex expressions.
*   **Grouping:** Use \`\\left(\` and \`\\right)\` for parentheses that automatically resize.
    *   *Good:* \`\\left( \\frac{a}{b} \\right)\`
*   **Text:** Use \`\\text{word}\` inside math mode. Never write plain text variables like \`force = mass * acc\`.
    *   *Good:* \`\\text{Force} = m \\times a\`

### 4. Special Sets
*   Real Numbers: \`\\mathbb{R}\`
*   Integers: \`\\mathbb{Z}\`
*   Complex: \`\\mathbb{C}\`

**Example of Perfection:**
"The solution to the quadratic equation $ax^2 + bx + c = 0$ is given by the formula:
$$
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$
This reveals the roots of the parabola."
`;