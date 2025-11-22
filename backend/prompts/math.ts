/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const MATH_RENDERING_INSTRUCTIONS = `
# 📐 THE COMPLETE MATHEMATICS RENDERING DOCTRINE
## Master Guide to MathJax Mathematical Typography

\`\`\`
╔════════════════════════════════════════════════════════════╗
║  THE LAW OF MATHEMATICAL BEAUTY                            ║
║  "Mathematics is the poetry of logical ideas"              ║
║  - Albert Einstein                                         ║
║                                                            ║
║  VERSION: Comprehensive Edition                            ║
║  RENDERER: MathJax (The Gold Standard)                     ║
║  STATUS: ⚡ MANDATORY COMPLIANCE                           ║
╚════════════════════════════════════════════════════════════╝
\`\`\`

---

## 🌟 PHILOSOPHICAL FOUNDATION

Mathematical notation is not merely functional—it is an **art form** that communicates the profound elegance of logical relationships. Proper rendering transforms abstract concepts into visual poetry.

**Core Principles:**
- ✨ **Clarity:** Every symbol must be unambiguous
- 🎯 **Precision:** Spacing and alignment matter
- 💫 **Elegance:** Beauty emerges from correct structure
- 🚀 **Consistency:** Use uniform notation throughout

---

## 📘 TABLE OF CONTENTS

1. [Basic Syntax Rules](#basic-syntax)
2. [Inline Mathematics](#inline-math)
3. [Display Mathematics](#display-math)
4. [Fundamental Operations](#operations)
5. [Fractions & Roots](#fractions-roots)
6. [Exponents & Subscripts](#exponents-subscripts)
7. [Greek Letters & Symbols](#greek-symbols)
8. [Calculus Notation](#calculus)
9. [Linear Algebra](#linear-algebra)
10. [Set Theory & Logic](#set-theory)
11. [Statistics & Probability](#statistics)
12. [Advanced Structures](#advanced)
13. [Physics Equations](#physics)
14. [Chemistry Notation](#chemistry)
15. [Common Errors](#errors)

---

## 🎯 BASIC SYNTAX RULES {#basic-syntax}

### Delimiter Taxonomy

**INLINE MATH** (flows with text):
\`\`\`markdown
Use single dollar signs: $expression$
\`\`\`

**DISPLAY MATH** (centered, standalone):
\`\`\`markdown
Use double dollar signs on separate lines:

$$
expression
$$
\`\`\`

### ⚡ Choosing the Right Format (CRITICAL)

**Your choice of delimiter is a deliberate design decision.**

**Use INLINE MATH ($...$) when:**
- The expression is short and simple (e.g., $E=mc^2$, $x > 0$).
- You are referencing variables within a sentence (e.g., "where $\\lambda$ represents the wavelength").
- The equation is part of the natural flow of the text.
- **Goal:** To integrate math seamlessly without disrupting the reading flow.

**Use DISPLAY MATH ($$..$$) when:**
- The equation is long, complex, or multi-line.
- It is the primary subject of the sentence (e.g., "The equation is as follows:").
- You want to draw special attention to it for emphasis.
- It needs to be numbered or referenced later.
- **Goal:** To make a mathematical statement a centerpiece for clarity and focus.

**Example of correct usage:**

The kinetic energy of an object is given by the formula $KE = \\frac{1}{2}mv^2$, where $m$ is mass and $v$ is velocity. For a more complex system, like the Schrödinger equation, it is better to display it:

$$
i\\hbar\\frac{\\partial}{\\partial t}\\Psi(\\mathbf{r},t) = \\hat{H}\\Psi(\\mathbf{r},t)
$$

This ensures readability for important formulas.

### Critical Spacing Rules

\`\`\`markdown
✅ CORRECT:
The equation $E = mc^2$ is famous.

$$
E = mc^2
$$

❌ WRONG:
The equation $$E=mc^2$$ is famous.  ← Display math inline
$ E = mc^2 $                          ← Spaces inside delimiters
$$E = mc^2$$                          ← Display math not on own line
\`\`\`

---

## 💫 INLINE MATHEMATICS {#inline-math}

### Basic Examples

The Pythagorean theorem states that $a^2 + b^2 = c^2$ for right triangles.

Newton's second law: $F = ma$ relates force, mass, and acceleration.

The quadratic formula $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$ solves any quadratic.

Euler's identity: $e^{i\\pi} + 1 = 0$ unites five fundamental constants.

The derivative $\\frac{dy}{dx}$ represents instantaneous rate of change.

---

## 🎆 DISPLAY MATHEMATICS {#display-math}

### Fundamental Theorems

The fundamental theorem of calculus:

$$
\\int_a^b f(x)\\,dx = F(b) - F(a)
$$

The Schrödinger equation governs quantum mechanics:

$$
i\\hbar\\frac{\\partial}{\\partial t}\\Psi(\\mathbf{r},t) = \\hat{H}\\Psi(\\mathbf{r},t)
$$

The Fourier transform connects time and frequency domains:

$$
F(\\omega) = \\int_{-\\infty}^{\\infty} f(t)e^{-i\\omega t}\\,dt
$$

---

## ➕ FUNDAMENTAL OPERATIONS {#operations}

### Arithmetic Operators

**Addition & Subtraction:**
$a + b - c$

**Multiplication:**
- Explicit: $a \\times b$ or $a \\cdot b$
- Implicit: $ab$ or $2x$

**Division:**
- Inline: $a \\div b$ or $a / b$
- Fraction: $\\frac{a}{b}$

**Plus-Minus:**
$x = a \\pm b$

**Minus-Plus:**
$x = a \\mp b$

---

## 📊 FRACTIONS & ROOTS {#fractions-roots}

### Fraction Variants

**Standard Fraction:**
$$
\\frac{numerator}{denominator}
$$

**Continued Fractions:**
$$
x = a_0 + \\frac{1}{a_1 + \\frac{1}{a_2 + \\frac{1}{a_3 + \\cdots}}}
$$

**Binomial Coefficient:**
$$
\\binom{n}{k} = \\frac{n!}{k!(n-k)!}
$$

**Mixed Fractions (using \\tfrac for inline):**
Text with $\\tfrac{1}{2}$ inline fraction.

### Root Expressions

**Square Root:**
$\\sqrt{x}$ or $\\sqrt{x^2 + y^2}$

**Nth Root:**
$\\sqrt[n]{x}$ produces $\\sqrt[3]{27} = 3$

**Nested Roots:**
$$
\\sqrt{2 + \\sqrt{2 + \\sqrt{2 + \\cdots}}}
$$

---

## ⬆️ EXPONENTS & SUBSCRIPTS {#exponents-subscripts}

### Basic Syntax

**Superscripts (Exponents):**
$x^2$, $e^{-\\frac{x^2}{2}}$, $2^{2^{2^2}}$

**Subscripts (Indices):**
$x_1$, $a_{ij}$, $x_{n+1}$

**Combined:**
$x_i^2$, $\\sum_{i=1}^{n} x_i^2$

### Complex Examples

**Exponential Function:**
$$
e^x = \\sum_{n=0}^{\\infty} \\frac{x^n}{n!}
$$

**Tower of Powers:**
$$
2^{2^{2^{2}}}
$$

**Multiple Subscripts:**
$$
T^{\\mu\\nu}_{\alpha\\beta}
$$

---

## 🔤 GREEK LETTERS & SYMBOLS {#greek-symbols}

### Complete Greek Alphabet

**Lowercase:**
$\\alpha$ \\alpha    $\\beta$ \\beta      $\\gamma$ \\gamma    $\\delta$ \\delta
$\\epsilon$ \\epsilon  $\\zeta$ \\zeta   $\\eta$ \\eta        $\\theta$ \\theta
$\\iota$ \\iota      $\\kappa$ \\kappa    $\\lambda$ \\lambda  $\\mu$ \\mu
$\\nu$ \\nu          $\\xi$ \\xi          $\\pi$ \\pi          $\\rho$ \\rho
$\\sigma$ \\sigma    $\\tau$ \\tau        $\\upsilon$ \\upsilon $\\phi$ \\phi
$\\chi$ \\chi        $\\psi$ \\psi        $\\omega$ \\omega

**Uppercase:**
$\\Gamma$ \\Gamma    $\\Delta$ \\Delta    $\\Theta$ \\Theta    $\\Lambda$ \\Lambda
$\\Xi$ \\Xi          $\\Pi$ \\Pi          $\\Sigma$ \\Sigma    $\\Phi$ \\Phi
$\\Psi$ \\Psi        $\\Omega$ \\Omega

**Variants:**
$\\varepsilon$ \\varepsilon    $\\vartheta$ \\vartheta    $\\varphi$ \\varphi
$\\varrho$ \\varrho            $\\varsigma$ \\varsigma

### Common Mathematical Symbols

**Infinity & Special:**
$\\infty$ \\infty          $\\partial$ \\partial      $\\nabla$ \\nabla
$\\hbar$ \\hbar            $\\ell$ \\ell              $\\aleph$ \\aleph

**Comparison:**
$\\leq$ \\leq    $\\geq$ \\geq    $\\neq$ \\neq    $\\approx$ \\approx
$\\equiv$ \\equiv    $\\sim$ \\sim    $\\propto$ \\propto

**Arrows:**
$\\rightarrow$ \\rightarrow    $\\leftarrow$ \\leftarrow    
$\\Rightarrow$ \\Rightarrow    $\\Leftarrow$ \\Leftarrow
$\\leftrightarrow$ \\leftrightarrow    $\\Leftrightarrow$ \\Leftrightarrow
$\\mapsto$ \\mapsto            $\\to$ \\to

**Set Operations:**
$\\in$ \\in    $\\notin$ \\notin    $\\subset$ \\subset    $\\subseteq$ \\subseteq
$\\cup$ \\cup    $\\cap$ \\cap    $\\emptyset$ \\emptyset    $\\forall$ \\forall
$\\exists$ \\exists    $\\nexists$ \\nexists

**Logic:**
$\\land$ \\land    $\\lor$ \\lor    $\\neg$ \\neg    $\\implies$ \\implies
$\\iff$ \\iff

---

## 📈 CALCULUS NOTATION {#calculus}

### Derivatives

**Basic Derivative:**
$\\frac{dy}{dx}$ or $\\frac{df}{dx}$ or $f'(x)$ or $\\dot{x}$

**Partial Derivatives:**
$\\frac{\\partial f}{\\partial x}$ or $\\partial_x f$

**Higher Derivatives:**
$\\frac{d^2y}{dx^2}$ or $f''(x)$ or $\\ddot{x}$

**Gradient:**
$$
\\nabla f = \\left(\\frac{\\partial f}{\\partial x}, \\frac{\\partial f}{\\partial y}, \\frac{\\partial f}{\\partial z}\\right)
$$

**Laplacian:**
$$
\\nabla^2 f = \\frac{\\partial^2 f}{\\partial x^2} + \\frac{\\partial^2 f}{\\partial y^2} + \\frac{\\partial^2 f}{\\partial z^2}
$$

### Integrals

**Definite Integral:**
$$
\\int_a^b f(x)\\,dx
$$

**Indefinite Integral:**
$$
\\int f(x)\\,dx = F(x) + C
$$

**Multiple Integrals:**
$$
\\iint_D f(x,y)\\,dA \\quad \\iiint_V f(x,y,z)\\,dV
$$

**Contour Integral:**
$$
\\oint_C f(z)\\,dz
$$

**Line Integral:**
$$
\\int_C \\mathbf{F} \\cdot d\\mathbf{r}
$$

### Limits

**Standard Limit:**
$$
\\lim_{x \\to a} f(x) = L
$$

**One-Sided Limits:**
$$
\\lim_{x \\to a^+} f(x) \\quad \\lim_{x \\to a^-} f(x)
$$

**Infinity Limits:**
$$
\\lim_{x \\to \\infty} f(x) \\quad \\lim_{x \\to -\\infty} f(x)
$$

**L'Hôpital's Rule:**
$$
\\lim_{x \\to a} \\frac{f(x)}{g(x)} = \\lim_{x \\to a} \\frac{f'(x)}{g'(x)}
$$

---

## 🔢 LINEAR ALGEBRA {#linear-algebra}

### Vectors

**Vector Notation:**
$\\vec{v}$ or $\\mathbf{v}$ or $\\boldsymbol{v}$

**Column Vector:**
$$
\\mathbf{v} = \\begin{bmatrix} v_1 \\\\ v_2 \\\\ v_3 \\end{bmatrix}
$$

**Row Vector:**
$$
\\mathbf{v}^T = \\begin{bmatrix} v_1 & v_2 & v_3 \\end{bmatrix}
$$

**Dot Product:**
$$
\\mathbf{a} \\cdot \\mathbf{b} = \\sum_{i=1}^{n} a_i b_i
$$

**Cross Product:**
$$
\\mathbf{a} \\times \\mathbf{b} = \\begin{vmatrix} \\mathbf{i} & \\mathbf{j} & \\mathbf{k} \\\\ a_1 & a_2 & a_3 \\\\ b_1 & b_2 & b_3 \\end{vmatrix}
$$

### Matrices

**Basic Matrix:**
$$
A = \\begin{bmatrix}
a_{11} & a_{12} & a_{13} \\\\
a_{21} & a_{22} & a_{23} \\\\
a_{31} & a_{32} & a_{33}
\\end{bmatrix}
$$

**Matrix with Parentheses:**
$$
A = \\begin{pmatrix}
1 & 2 \\\\
3 & 4
\\end{pmatrix}
$$

**Determinant:**
$$
\\det(A) = \\begin{vmatrix}
a & b \\\\
c & d
\\end{vmatrix} = ad - bc
$$

**Identity Matrix:**
$$
I = \\begin{bmatrix}
1 & 0 & 0 \\\\
0 & 1 & 0 \\\\
0 & 0 & 1
\\end{bmatrix}
$$

**Transpose:**
$$
A^T = \\begin{bmatrix}
a_{11} & a_{21} & a_{31} \\\\
a_{12} & a_{22} & a_{32}
\\end{bmatrix}
$$

**Inverse:**
$$
A^{-1}A = AA^{-1} = I
$$

### Matrix Operations

**Eigenvalue Equation:**
$$
A\\mathbf{v} = \\lambda\\mathbf{v}
$$

**Characteristic Polynomial:**
$$
\\det(A - \\lambda I) = 0
$$

**Matrix Multiplication:**
$$
(AB)_{ij} = \\sum_{k=1}^{n} A_{ik}B_{kj}
$$

**Trace:**
$$
\\text{tr}(A) = \\sum_{i=1}^{n} a_{ii}
$$

---

## 🔣 SET THEORY & LOGIC {#set-theory}

### Set Notation

**Basic Sets:**
- Natural numbers: $\\mathbb{N} = \\{1, 2, 3, \\ldots\\}$
- Integers: $\\mathbb{Z} = \\{\\ldots, -2, -1, 0, 1, 2, \\ldots\\}$
- Rationals: $\\mathbb{Q}$
- Reals: $\\mathbb{R}$
- Complex: $\\mathbb{C}$

**Set Builder Notation:**
$$
S = \\{x \\in \\mathbb{R} \\mid x^2 < 4\\}
$$

**Set Operations:**
- Union: $A \\cup B$
- Intersection: $A \\cap B$
- Difference: $A \\setminus B$
- Complement: $A^c$ or $\\overline{A}$
- Cartesian Product: $A \\times B$

**Subset Relations:**
$$
A \\subset B \\quad A \\subseteq B \\quad A \\supset B \\quad A \\supseteq B
$$

### Logic Symbols

**Quantifiers:**
- Universal: $\\forall x \\in S, P(x)$
- Existential: $\\exists x \\in S, P(x)$
- Unique existence: $\\exists! x, P(x)$

**Logical Connectives:**
- And: $P \\land Q$
- Or: $P \\lor Q$
- Not: $\\neg P$ or $\\lnot P$
- Implies: $P \\implies Q$ or $P \\Rightarrow Q$
- If and only if: $P \\iff Q$ or $P \\Leftrightarrow Q$

**Truth Tables:**
$$
\\begin{array}{c|c|c}
P & Q & P \\land Q \\\\
\\hline
T & T & T \\\\
T & F & F \\\\
F & T & F \\\\
F & F & F
\\end{array}
$$

---

## 📊 STATISTICS & PROBABILITY {#statistics}

### Probability Notation

**Basic Probability:**
$$
P(A) \\quad P(A \\cap B) \\quad P(A \\cup B)
$$

**Conditional Probability:**
$$
P(A|B) = \\frac{P(A \\cap B)}{P(B)}
$$

**Bayes' Theorem:**
$$
P(A|B) = \\frac{P(B|A) \\cdot P(A)}{P(B)}
$$

**Law of Total Probability:**
$$
P(B) = \\sum_{i=1}^{n} P(B|A_i)P(A_i)
$$

### Statistical Measures

**Mean (Expected Value):**
$$
\\mu = \\mathbb{E}[X] = \\sum_{i=1}^{n} x_i p_i \\quad \\text{or} \\quad \\int_{-\\infty}^{\\infty} x f(x)\\,dx
$$

**Variance:**
$$
\\sigma^2 = \\text{Var}(X) = \\mathbb{E}[(X-\\mu)^2] = \\mathbb{E}[X^2] - (\\mathbb{E}[X])^2
$$

**Standard Deviation:**
$$
\\sigma = \\sqrt{\\text{Var}(X)}
$$

**Covariance:**
$$
\\text{Cov}(X,Y) = \\mathbb{E}[(X-\\mu_X)(Y-\\mu_Y)]
$$

**Correlation:**
$$
\\rho_{X,Y} = \\frac{\\text{Cov}(X,Y)}{\\sigma_X \\sigma_Y}
$$

### Distributions

**Normal Distribution:**
$$
f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}
$$

**Binomial Distribution:**
$$
P(X = k) = \\binom{n}{k} p^k (1-p)^{n-k}
$$

**Poisson Distribution:**
$$
P(X = k) = \\frac{\\lambda^k e^{-\\lambda}}{k!}
$$

**Chi-Square Test:**
$$
\\chi^2 = \\sum_{i=1}^{n} \\frac{(O_i - E_i)^2}{E_i}
$$

---

## 🎓 ADVANCED STRUCTURES {#advanced}

### Piecewise Functions

$$
f(x) = \\begin{cases}
x^2 & \\text{if } x \\geq 0 \\\\
-x^2 & \\text{if } x < 0
\\end{cases}
$$

**Absolute Value:**
$$
|x| = \\begin{cases}
x & \\text{if } x \\geq 0 \\\\
-x & \\text{if } x < 0
\\end{cases}
$$

**Heaviside Step Function:**
$$
H(x) = \\begin{cases}
0 & \\text{if } x < 0 \\\\
\\frac{1}{2} & \\text{if } x = 0 \\\\
1 & \\text{if } x > 0
\\end{cases}
$$

### Multi-line Equations with Alignment

$$
\\begin{align}
f(x) &= (x+1)^2 \\\\
     &= x^2 + 2x + 1 \\\\
     &= x^2 + 2x + 1
\\end{align}
$$

**Without Numbering (use aligned):**
$$
\\begin{aligned}
\\nabla \\times \\vec{E} &= -\\frac{\\partial \\vec{B}}{\\partial t} \\\\
\\nabla \\times \\vec{B} &= \\mu_0\\vec{J} + \\mu_0\\epsilon_0\\frac{\\partial \\vec{E}}{\\partial t}
\\end{aligned}
$$

### Systems of Equations

$$
\\begin{cases}
x + y = 5 \\\\
2x - y = 1
\\end{cases}
$$

**Matrix Form:**
$$
\\begin{bmatrix}
1 & 1 \\\\
2 & -1
\\end{bmatrix}
\\begin{bmatrix}
x \\\\
y
\\end{bmatrix}
=
\\begin{bmatrix}
5 \\\\
1
\\end{bmatrix}
$$

### Summations and Products

**Finite Sum:**
$$
\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}
$$

**Infinite Series:**
$$
\\sum_{n=0}^{\\infty} \\frac{1}{2^n} = 2
$$

**Double Summation:**
$$
\\sum_{i=1}^{m} \\sum_{j=1}^{n} a_{ij}
$$

**Product Notation:**
$$
\\prod_{i=1}^{n} i = n!
$$

**Binomial Theorem:**
$$
(x+y)^n = \\sum_{k=0}^{n} \\binom{n}{k} x^{n-k} y^k
$$

---

## ⚛️ PHYSICS EQUATIONS {#physics}

### Classical Mechanics

**Newton's Laws:**
$$
\\vec{F} = m\\vec{a} = \\frac{d\\vec{p}}{dt}
$$

**Kinetic Energy:**
$$
KE = \\frac{1}{2}mv^2
$$

**Potential Energy (Gravitational):**
$$
PE = mgh
$$

**Conservation of Energy:**
$$
E_{\\text{total}} = KE + PE = \\text{constant}
$$

**Angular Momentum:**
$$
\\vec{L} = \\vec{r} \\times \\vec{p} = I\\vec{\\omega}
$$

### Electromagnetism

**Maxwell's Equations:**
$$
\\begin{aligned}
\\nabla \\cdot \\vec{E} &= \\frac{\\rho}{\\epsilon_0} & \\text{(Gauss's law)} \\\\
\\nabla \\cdot \\vec{B} &= 0 & \\text{(No magnetic monopoles)} \\\\
\\nabla \\times \\vec{E} &= -\\frac{\\partial \\vec{B}}{\\partial t} & \\text{(Faraday's law)} \\\\
\\nabla \\times \\vec{B} &= \\mu_0\\vec{J} + \\mu_0\\epsilon_0\\frac{\\partial \\vec{E}}{\\partial t} & \\text{(Ampère-Maxwell law)}
\\end{aligned}
$$

**Lorentz Force:**
$$
\\vec{F} = q(\\vec{E} + \\vec{v} \\times \\vec{B})
$$

**Coulomb's Law:**
$$
\\vec{F} = k_e \\frac{q_1 q_2}{r^2} \\hat{r}
$$

### Quantum Mechanics

**Schrödinger Equation (Time-Dependent):**
$$
i\\hbar\\frac{\\partial}{\\partial t}\\Psi(\\mathbf{r},t) = \\hat{H}\\Psi(\\mathbf{r},t)
$$

**Schrödinger Equation (Time-Independent):**
$$
\\hat{H}\\psi(\\mathbf{r}) = E\\psi(\\mathbf{r})
$$

**Heisenberg Uncertainty Principle:**
$$
\\Delta x \\cdot \\Delta p \\geq \\frac{\\hbar}{2}
$$

**Wave Function Normalization:**
$$
\\int_{-\\infty}^{\\infty} |\\Psi(x,t)|^2\\,dx = 1
$$

**Commutator:**
$$
[\\hat{A}, \\hat{B}] = \\hat{A}\\hat{B} - \\hat{B}\\hat{A}
$$

### Relativity

**Special Relativity - Energy-Mass:**
$$
E = mc^2
$$

**Relativistic Energy:**
$$
E = \\gamma mc^2 \\quad \\text{where} \\quad \\gamma = \\frac{1}{\\sqrt{1-\\frac{v^2}{c^2}}}
$$

**Lorentz Transformation:**
$$
\\begin{aligned}
x' &= \\gamma(x - vt) \\\\
t' &= \\gamma\\left(t - \\frac{vx}{c^2}\\right)
\\end{aligned}
$$

**Einstein Field Equations:**
$
G_{\\mu\\nu} + \\Lambda g_{\\mu\\nu} = \\frac{8\\pi G}{c^4} T_{\\mu\\nu}
$

**Schwarzschild Metric:**
$
ds^2 = -\\left(1-\\frac{2GM}{c^2r}\\right)c^2dt^2 + \\left(1-\\frac{2GM}{c^2r}\\right)^{-1}dr^2 + r^2d\\Omega^2
$

### Thermodynamics

**First Law:**
$
dU = \\delta Q - \\delta W
$

**Entropy:**
$
S = k_B \\ln \\Omega
$

**Carnot Efficiency:**
$
\\eta = 1 - \\frac{T_C}{T_H}
$

**Boltzmann Distribution:**
$
P(E) = \\frac{e^{-E/k_BT}}{Z} \\quad \\text{where} \\quad Z = \\sum_i e^{-E_i/k_BT}
$

**Ideal Gas Law:**
$
PV = nRT = Nk_BT
$

---

## 🧪 CHEMISTRY NOTATION {#chemistry}

### Chemical Equations

**Combustion Reaction:**
$
\\text{CH}_4 + 2\\text{O}_2 \\rightarrow \\text{CO}_2 + 2\\text{H}_2\\text{O}
$

**Equilibrium:**
$
\\text{N}_2 + 3\\text{H}_2 \\rightleftharpoons 2\\text{NH}_3
$

**Ionic Equation:**
$
\\text{Ag}^+ + \\text{Cl}^- \\rightarrow \\text{AgCl}_{(s)}
$

### Thermochemistry

**Enthalpy Change:**
$
\\Delta H = H_{\\text{products}} - H_{\\text{reactants}}
$

**Gibbs Free Energy:**
$
\\Delta G = \\Delta H - T\\Delta S
$

**Equilibrium Constant:**
$
K_{eq} = \\frac{[\\text{C}]^c[\\text{D}]^d}{[\\text{A}]^a[\\text{B}]^b}
$

**Nernst Equation:**
$
E = E^\\circ - \\frac{RT}{nF}\\ln Q
$

### Quantum Chemistry

**Molecular Orbitals:**
$
\\Psi_{\\text{bonding}} = \\psi_A + \\psi_B
$

**Pauli Exclusion Principle:**
$
|\\Psi(x_1, x_2)\\rangle = -|\\Psi(x_2, x_1)\\rangle
$

**Born-Oppenheimer Approximation:**
$
\\Psi_{\\text{total}} = \\Psi_{\\text{electronic}} \\cdot \\Psi_{\\text{nuclear}}
$

---

## 🎨 SPECIAL FORMATTING & TEXT {#special-formatting}

### Text in Math Mode

**Roman Text:**
$
\\text{force} = \\text{mass} \\times \\text{acceleration}
$

**Bold Math:**
$
\\mathbf{F} = m\\mathbf{a}
$

**Calligraphic:**
$
\\mathcal{L}, \\mathcal{F}, \\mathcal{H}
$

**Blackboard Bold (for number sets):**
$
\\mathbb{R}, \\mathbb{C}, \\mathbb{N}, \\mathbb{Z}, \\mathbb{Q}
$

**Fraktur:**
$
\\mathfrak{g}, \\mathfrak{su}(2)
$

**Script:**
$
\\mathscr{L}, \\mathscr{F}
$

### Spacing Control

**Thin Space:** $a\\,b$ using \\,
**Medium Space:** $a\\:b$ using \\:
**Thick Space:** $a\\;b$ using \\;
**Quad Space:** $a\\quad b$ using \\quad
**Double Quad:** $a\\qquad b$ using \\qquad
**Negative Space:** $a\\!b$ using \\!

**Example - Differential:**
$
\\int x^2\\,dx \\quad \\text{(correct spacing)}
$

$
\\int x^2 dx \\quad \\text{(no spacing - less clear)}
$

### Accents and Decorations

**Hat:** $\\hat{x}$, $\\widehat{xyz}$
**Bar:** $\\bar{x}$, $\\overline{xyz}$
**Tilde:** $\\tilde{x}$, $\\widetilde{xyz}$
**Dot (time derivative):** $\\dot{x}$, $\\ddot{x}$
**Vector:** $\\vec{v}$
**Arrow:** $\\overrightarrow{AB}$
**Underline:** $\\underline{x}$
**Overbrace:** $\\overbrace{a+b+c}^{\\text{sum}}$
**Underbrace:** $\\underbrace{a+b+c}_{\\text{sum}}$

---

## 🚫 COMMON ERRORS & TROUBLESHOOTING {#errors}

### ❌ **ERROR 1: Wrong Delimiters**

**Problem:**
\`\`\`markdown
\\(x^2\\) or \\[x^2\\]  ← LaTeX-style (WRONG)
\`\`\`

**Solution:**
\`\`\`markdown
$x^2$ (inline) or $$ x^2 $$ (display) ← MathJax-style (CORRECT)
\`\`\`

---

### ❌ **ERROR 2: Display Math Inline**

**Problem:**
\`\`\`markdown
The equation $$E=mc^2$$ shows... ← Display delimiters inline (WRONG)
\`\`\`

**Solution:**
\`\`\`markdown
The equation $E=mc^2$ shows... ← Inline delimiters (CORRECT)

Or use display on separate lines:

$$
E=mc^2
$$
\`\`\`

---

### ❌ **ERROR 3: Missing Escape Characters**

**Problem:**
\`\`\`markdown
$x_1, x_2, ..., x_n$ ← Renders literal dots (WRONG)
\`\`\`

**Solution:**
\`\`\`markdown
$x_1, x_2, \\ldots, x_n$ ← Use \\ldots (CORRECT)
\`\`\`

---

### ❌ **ERROR 4: Incorrect Fraction Syntax**

**Problem:**
\`\`\`markdown
$1/2$ ← Renders as division symbol (suboptimal)
\`\`\`

**Solution:**
\`\`\`markdown
$\\frac{1}{2}$ ← Proper fraction rendering (CORRECT)
\`\`\`

---

### ❌ **ERROR 5: Missing Braces for Multi-Character Sub/Superscripts**

**Problem:**
\`\`\`markdown
$x^10$ renders as $x^{10}$ but $x^10$ displays wrong spacing
$x_max$ ← Only 'm' is subscripted (WRONG)
\`\`\`

**Solution:**
\`\`\`markdown
$x^{10}$ ← Braces for multi-digit exponent (CORRECT)
$x_{\\text{max}}$ ← Braces for multi-character subscript (CORRECT)
\`\`\`

---

### ❌ **ERROR 6: Spacing Issues**

**Problem:**
\`\`\`markdown
$\\int f(x)dx$ ← No space between function and differential (unclear)
\`\`\`

**Solution:**
\`\`\`markdown
$\\int f(x)\\,dx$ ← Thin space with \\, (CORRECT)
\`\`\`

---

### ❌ **ERROR 7: Matrix Environment Errors**

**Problem:**
\`\`\`markdown
$$
\\begin{matrix}
a & b  ← Missing \\\\ at end of row (WRONG)
c & d
\\end{matrix}
$$
\`\`\`

**Solution:**
\`\`\`markdown
$$
\\begin{matrix}
a & b \\\\
c & d
\\end{matrix}
$$
\`\`\`

---

## ✅ BEST PRACTICES CHECKLIST

### For Inline Math:
- ✅ Use single dollar signs \`$…$\`
- ✅ Keep expressions concise
- ✅ Ensure they flow naturally with text
- ❌ Never use display delimiters \`$$\` inline

### For Display Math:
- ✅ Use double dollar signs on separate lines
- ✅ Center important equations
- ✅ Add blank lines before and after for clarity
- ❌ Never put other text on the same line

### For Complex Expressions:
- ✅ Use \`\\left\` and \`\\right\` for auto-sizing delimiters
- ✅ Use \`\\,\` for spacing in integrals
- ✅ Use \`\\text{}\` for text within math mode
- ✅ Use braces \`{}\` for multi-character scripts

### For Readability:
- ✅ Align multi-line equations with \`aligned\` environment
- ✅ Use descriptive variable names when possible
- ✅ Add spacing with \`\\quad\` for visual separation
- ✅ Break long equations into multiple lines

---

## 🎯 FINAL WISDOM

\`\`\`
╔══════════════════════════════════════════════════════╗
║                                                      ║
║   "Mathematics is the language in which God has      ║
║    written the universe."                            ║
║                         - Galileo Galilei            ║
║                                                      ║
║   Render it with precision.                          ║
║   Render it with beauty.                             ║
║   Render it with MathJax.                            ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
\`\`\`

**Remember:**
- 📐 Use \`$…$\` for inline mathematics
- 🎆 Use \`$$…$$\` on separate lines for display mathematics
- ✨ Follow proper syntax for beautiful rendering
- 🚫 Avoid LaTeX-only delimiters \`\\(…\\)\` and \`\\[…\\]\`
- 💎 Mathematics is an art form—render it elegantly

---

## 📖 END OF COMPREHENSIVE GUIDE

*This document covers basic to advanced mathematical notation rendering with MathJax. For additional symbols and advanced features, consult the official MathJax documentation.*

\`\`\`
═══════════════════════════════════════════════════════
     Complete MathJax Mathematics Rendering Guide
          From Basic Arithmetic to Quantum Mechanics
═══════════════════════════════════════════════════════
\`\`\`
