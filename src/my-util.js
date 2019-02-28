exports.mkliteral = function (value, raw) {
    if (value instanceof RegExp) {
        return {
            type: 'Literal',
            value: value,
            raw: raw
        };
    }
    if (value === undefined) {
        return {
            type: 'Identifier',
            name: 'undefined',
            pure: true,
            value: value
        };
    }
    if (value === null) {
        return {
            type: 'Identifier',
            name: 'null',
            pure: true,
            value: value
        };
    }
    if (typeof value === 'number' && isNaN(value)) {
        return {
            type: 'Identifier',
            name: 'NaN',
            pure: true,
            value: value
        };
    }
    if (value < 0) {
        return {
            type: 'UnaryExpression',
            operator: '-',
            value: value,
            pure: true,
            argument: {
                type: 'Literal',
                pure: true,
                value: -value,
                raw: JSON.stringify(-value)
            }
        }
    }
    if (typeof (value) === "object" && value.type) {
        return value;
    }
    return {
        type: 'Literal',
        pure: true,
        value: value,
        raw: JSON.stringify(value)
    };
}

// Missing += etc
exports.boperators = {
    '+': function (a, b) {
        return a + b;
    },
    '-': function (a, b) {
        return a - b;
    },
    '*': function (a, b) {
        return a * b;
    },
    '**': function (a, b) {
        return a ** b;
    },
    '/': function (a, b) {
        return a / b;
    },
    '||': function (a, b) {
        return a || b;
    },
    '&&': function (a, b) {
        return a && b;
    },
    '|': function (a, b) {
        return a | b;
    },
    '&': function (a, b) {
        return a & b;
    },
    '%': function (a, b) {
        return a % b;
    },
    '^': function (a, b) {
        return a ^ b;
    },
    '<<': function (a, b) {
        return a << b;
    },
    '>>': function (a, b) {
        return a >> b;
    },
    '>>>': function (a, b) {
        return a >>> b;
    },
    '==': function (a, b) {
        return a == b;
    },
    '===': function (a, b) {
        return a === b;
    },
    '!=': function (a, b) {
        return a != b;
    },
    '!==': function (a, b) {
        return a !== b;
    },
    '>=': function (a, b) {
        return a >= b;
    },
    '<=': function (a, b) {
        return a <= b;
    },
    '<': function (a, b) {
        return a < b;
    },
    '>': function (a, b) {
        return a > b;
    },
    // 'in': function(a, b) { return a in b; }, //mm not sure it's so simple..
    '+=': function (a, b) {
        return a + b;
    }
    /** missing -= *= /= ... */
};

exports.uoperators = {
    '!': function (a) {
        return !a;
    },
    '~': function (a) {
        return ~a;
    },
    '+': function (a) {
        return +a;
    },
    '-': function (a) {
        return -a;
    },
    '--': function (a) {
        return --a;
    },
    '++': function (a) {
        return ++a;
    },
    'typeof': function (a) {
        return typeof a;
    }
};

/*exports.wrapBlockStatement = function () {
    return {
        type: 'BlockStatement',
        body: []
    }
};*/



class BaseStatement {

    constructor() {
        this._ast = {}
    }

    get ast() {
        return this._ast;
    }

}

exports.BlockStatement = class BlockStatement extends BaseStatement {

    constructor() {
        super();
        this._ast = {
            type: 'BlockStatement',
            body: []
        }
    }

    static create() {
        return new BlockStatement();
    }

    add(exps) {
        if (exps instanceof Array) {
            this._ast.body = this.ast.body.concat(exps);
        } else {
            this._ast.body.push(exps);
        }
        return this;
    }

};

exports.IfStatement = class IfStatement extends BaseStatement {

    constructor() {
        super();
        this._ast = {
            type: 'IfStatement',
            test: undefined,
            consequent: undefined,
            alternate: undefined
        }
    }

    static create() {
        return new IfStatement();
    }

    consequent(consequent) {
        this._ast.consequent = consequent;
        return this;
    }

    test(test) {
        this._ast.test = test;
        return this;
    }

    alternate(alternate) {
        this._ast.alternate = alternate;
        return this;
    }
};

exports.ExpressionStatement = class ExpressionStatement extends BaseStatement {

    constructor() {
        super();
        this._ast = {
            type: 'ExpressionStatement',
            expression: undefined
        };
    }

    static create() {
        return new ExpressionStatement();
    }

    expression(expression) {
        this._ast.expression = expression;
        return this;
    }

};
