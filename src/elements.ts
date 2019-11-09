// =============================================================================
// Hilbert.js | Expressions
// (c) Mathigon
// =============================================================================


import {join, Obj, unique} from '@mathigon/core';
import {CONSTANTS, escape, isSpecialFunction} from './symbols';
import {collapseTerm} from './parser';
import {ExprError} from './errors';


export interface MathMLArgument {
  val: ExprElement;
  toString: () => string;
}

export type CustomFunction = ((...args: number[]) => number);
export type VarMap = Obj<number|CustomFunction>;
export type ExprMap = Obj<ExprElement>;
export type MathMLMap = Obj<(...args: MathMLArgument[]) => string>;


/**
 * Maths Expression
 */
export abstract class ExprElement {

  /** Evaluates an expression using a given map of variables and functions. */
  evaluate(vars: VarMap = {}): number { return NaN; }

  /** Substitutes a new expression for a variable. */
  substitute(vars: ExprMap = {}): ExprElement { return this; }

  /** Returns the simplest mathematically equivalent expression. */
  get simplified(): ExprElement { return this; }

  /** Returns a list of all variables used in the expression. */
  get variables(): string[] { return []; }

  /** Returns a list of all functions called by the expression. */
  get functions(): string[] { return []; }

  /** Collapses all terms into functions. */
  collapse(): ExprElement { return this; }

  /** Converts the expression to a plain text string. */
  toString() { return ''; }

  /** Converts the expression to a MathML string. */
  toMathML(custom: MathMLMap = {}) { return ''; }
}

// -----------------------------------------------------------------------------

export class ExprNumber extends ExprElement {

  constructor(readonly n: number) {
    super();
  }

  evaluate() { return this.n; }

  toString() { return '' + this.n; }

  toMathML() { return `<mn>${this.n}</mn>`; }
}

export class ExprIdentifier extends ExprElement {

  constructor(readonly i: string) {
    super();
  }

  evaluate(vars: VarMap = {}) {
    if (this.i in vars) return vars[this.i] as number;
    if (this.i in CONSTANTS) return CONSTANTS[this.i];
    throw ExprError.undefinedVariable(this.i);
  }

  toMathML() {
    const variant = isSpecialFunction(this.i) ? ' mathvariant="normal"' : '';
    return `<mi${variant}>${this.i}</mi>`;
  }

  substitute(vars: ExprMap = {}) { return vars[this.i] || this; }

  get variables() { return [this.i]; }

  toString() { return this.i; }
}

export class ExprString extends ExprElement {

  constructor(readonly s: string) {
    super();
  }

  evaluate(vars: VarMap = {}) {
    if (this.s in vars) return vars[this.s] as number;
    throw ExprError.undefinedVariable(this.s);
  }

  toString() { return '"' + this.s + '"'; }

  toMathML() { return `<mtext>${this.s}</mtext>`; }
}

export class ExprSpace extends ExprElement {

  toString() { return ' '; }

  toMathML() { return `<mspace/>`; }
}

export class ExprOperator extends ExprElement {

  constructor(readonly o: string) {
    super();
  }

  toString() { return this.o.replace('//', '/'); }

  get functions() { return [this.o]; }

  toMathML() {
    const op = escape(this.toString());
    return `<mo value="${op}">${op}</mo>`;
  }
}

export class ExprTerm extends ExprElement {

  constructor(readonly items: ExprElement[]) {
    super();
  }

  evaluate(vars: VarMap = {}) { return this.collapse().evaluate(vars); }

  substitute(vars: ExprMap = {}) { return this.collapse().substitute(vars); }

  get simplified() { return this.collapse().simplified; }

  get variables() { return unique(join(...this.items.map(i => i.variables))); }

  get functions() { return this.collapse().functions; }

  toString() { return this.items.map(i => i.toString()).join(' '); }

  toMathML(custom: MathMLMap = {}) {
    return this.items.map(i => i.toMathML(custom)).join('');
  }

  collapse() { return collapseTerm(this.items).collapse(); }
}