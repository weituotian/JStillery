var genCode = require("escodegen").generate;
var MyUtil = require("./my-util");

var reduceContext = {};

function ast_reduce(ast, parent) {
    if (!ast) {
        return ast;
    }
    let ret;
    parent = parent || {};

    console.log(genCode);

    var ast_reduce_scoped = function (child) {
        return ast_reduce(child, ast);
    };

    function arr_ast_reduce(targets) {
        const rets = [];
        targets.forEach(target => {
            const result = ast_reduce_scoped(target);
            if (result instanceof Array) {
                result.forEach(item => {
                    rets.push(item);
                });
            } else {
                rets.push(result);
            }
        });
        return rets;
    }

    switch (ast.type) {

        case 'Program':
            ret = {
                type: 'Program',
                body: arr_ast_reduce(ast.body)
            };
            return ret;

        case 'FunctionDeclaration':
            ret = {
                type: ast.type,
                id: ast.id,
                params: ast.params,
                body: ast_reduce_scoped(ast.body),
                test: ast.test,
                alreadyReduced: true,
                generator: ast.generator,
                expression: ast.expression
            };
            return ret;
        case 'FunctionExpression': {
            ret = {
                type: ast.type,
                id: ast.id,
                params: ast.params,
                defaults: ast.defaults,
                body: ast_reduce_scoped(ast.body),
                test: ast.test,
                generator: ast.generator,
                alreadyReduced: true,
                expression: ast.expression
            };
            return ret;
        }
        case 'CallExpression': {
            ret = {
                type: 'CallExpression',
                arguments: arr_ast_reduce(ast.arguments),
                callee: ast_reduce_scoped(ast.callee)
            };
            return ret
        }
        case 'IfStatement': {

            let tests = ast_reduce_scoped(ast.test);
            let consequent1 = ast_reduce_scoped(ast.consequent);
            let alternate1 = ast_reduce_scoped(ast.alternate);

            if (consequent1 instanceof Array) {
                consequent1 = MyUtil.BlockStatement.create().add(consequent1).ast;
            }

            if (tests instanceof Array) { // 如果if表达式里面有很多语句，分开

                let last = tests.pop();
                if (last.type === 'ExpressionStatement') {
                    last = last.expression;
                }
                tests.push({
                    type: 'IfStatement',
                    test: last,
                    consequent: consequent1,
                    alternate: alternate1
                });
                return tests;

            } else {
                ret = {
                    type: 'IfStatement',
                    test: tests,
                    consequent: consequent1,
                    alternate: alternate1
                };
                return ret;
            }

        }
        case 'ForStatement': {

            let inits = ast_reduce_scoped(ast.init);
            let test = ast_reduce_scoped(ast.test);
            let update = ast_reduce_scoped(ast.update);
            let body = ast_reduce_scoped(ast.body);

            if (body instanceof Array) {
                body = MyUtil.BlockStatement.create().add(body).ast;
            }


            if (inits instanceof Array) { // for的初始化语句可能有comma表达式
                let last = inits.pop();
                if (last.type === 'ExpressionStatement') {
                    last = last.expression;
                }
                inits.push({
                    type: ast.type,
                    init: last,
                    test: test,
                    update: update,
                    body: body
                });
                return inits;
            }
            ret = {
                type: ast.type,
                init: inits,
                test: test,
                update: update,
                body: body
            };

            return ret;

        }
        case 'AssignmentExpression':

            if (ast.right.type === 'ConditionalExpression') {
                ret = ast_reduce_scoped(ast.right)

            } else {
                ret = {
                    type: ast.type,
                    operator: ast.operator,
                    left: ast_reduce_scoped(ast.left),
                    right: ast_reduce_scoped(ast.right)
                };
            }
            return ret;

        case 'BlockStatement':
            ret = {
                type: ast.type,
                body: arr_ast_reduce(ast.body)
            };

            return ret;

        case 'Literal':
            return MyUtil.mkliteral(ast.value, ast.raw);
        case 'LogicalExpression': {
            // 转换为 if
            let left = ast_reduce_scoped(ast.left);
            let right = ast_reduce_scoped(ast.right);

            if (parent.type !== 'LogicalExpression' && parent.type !== 'IfStatement') {
                if (ast.operator === '&&') {
                    right = MyUtil.ExpressionStatement.create().expression(right).ast;
                    right = MyUtil.BlockStatement.create().add(right).ast;
                    return MyUtil.IfStatement.create().test(left).consequent(right).ast;
                }
                /*else if (ast.operator === '||') {
                               return MyUtil.IfStatement.create().test(left).consequent(right).ast;
                           }*/
            }

            return {
                type: ast.type,
                operator: ast.operator,
                left: left,
                right: right
            };
        }
        case 'UnaryExpression': {

            let arg = ast_reduce_scoped(ast.argument); // 可能是一个literal

            if (arg.pure && ast.operator in MyUtil.uoperators) {

                return MyUtil.mkliteral(MyUtil.uoperators[ast.operator](arg.value));
            }

            let ret = {
                "type": ast.type,
                "operator": ast.operator,
                "argument": arg,
                "prefix": ast.prefix
            };
            return ret;

        }

        case 'ReturnStatement': {
            if (ast.argument == null) {
                return ast;
            }

            const returns = ast_reduce_scoped(ast.argument);

            if (returns instanceof Array) {
                let last = returns.pop();
                returns.push({
                    type: 'ReturnStatement',
                    argument: last,
                });
                return returns;
            } else if (ast.argument.type === 'ConditionalExpression') {
                ret = returns
            } else {
                ret = {
                    type: 'ReturnStatement',
                    argument: returns,
                };
            }
            return ret;
        }
        case 'VariableDeclaration': {
            const rets = [];
            ast.declarations.forEach(declaration => { // 这里对分开每一个变量声明,var a,b => var a; var b;
                let declaras = ast_reduce_scoped(declaration); // 子表达式结果

                function handleDeclara(declara) {
                    if (declara.type === 'VariableDeclarator') {
                        ret = {
                            type: 'VariableDeclaration',
                            kind: ast.kind,
                            declarations: [declara]
                        };
                        rets.push(ret);
                    } else {
                        rets.push(declara);
                    }
                }

                if (declaras instanceof Array) {
                    declaras.forEach(handleDeclara);
                } else {
                    handleDeclara(declaras);
                }

            });
            return rets;
        }
        case 'VariableDeclarator': {

            if (ast.init.type === 'ConditionalExpression') {
                let rets = [];
                rets.push({
                    type: ast.type,
                    id: ast_reduce_scoped(ast.id),
                    init: {
                        "type": "Literal",
                        "value": null,
                        "raw": "null"
                    }
                }); // 变量声明
                rets.push(ast_reduce_scoped(ast.init));// 一个if语句
                return rets;
            } else {
                ret = {
                    type: ast.type,
                    id: ast_reduce_scoped(ast.id),
                    init: ast_reduce_scoped(ast.init)
                };
                return ret;
            }
        }
        case 'ExpressionStatement':

            let expressions = ast_reduce_scoped(ast.expression);
            if (expressions instanceof Array) {
                return expressions;
            }
            ret = {
                type: ast.type,
                expression: expressions
            };

            /// Transforms SequenceExpression a,b,c to BlockStatement a;b;c; but only if it is standalone (Ie not in another expression)
            /*
            c=3;
            test,v=4,h=4;
            -->
            c = 3;
            test;
            v = 4;
            h = 4;
            */


            return ret;

        case 'SequenceExpression': {
            const rets = [];

            ast.expressions.forEach(function (expression, index) {
                if (expression.type === 'BinaryExpression' || expression.type === 'Identifier') {
                    rets.push(ast_reduce_scoped(expression));
                } else {
                    rets.push({
                        type: "ExpressionStatement",
                        expression: ast_reduce_scoped(expression)
                    });
                }
            });
            return rets;

        }

        case 'ConditionalExpression': // a?b:c

            let getAssignExpression = function (parentVar, target) {
                let block = {
                    type: 'BlockStatement',
                    body: []
                };

                let assignExp = {
                    "type": "AssignmentExpression",
                    "operator": "=",
                    "left": parentVar,
                    // "right": consequent
                };
                let childResult = ast_reduce(target, assignExp);
                if (target.type === 'ConditionalExpression') {
                    assignExp = childResult; // 这里 childResult 将是一个if语句
                } else {
                    assignExp.right = childResult;
                }

                return assignExp;

                // block.body.push(assignExp);
                // return block;// 返回这个会有花括号
            };

            let getReturnExpression = function (target) {
                let returnExp = {
                    type: 'ReturnStatement',
                    // argument: last,
                };
                let childResult = ast_reduce(target, returnExp);
                if (target.type === 'ConditionalExpression') {
                    returnExp = childResult; // 这里 childResult 将是一个if语句
                } else {
                    returnExp.argument = childResult;
                }
                return returnExp;
            };

            if (parent.type === 'AssignmentExpression' || parent.type === 'VariableDeclarator') {
                // 例子: x= a?b:c
                // parentVar 代表x
                //  a?b:c 是当前
                // 目的是将x传进 a?b:c， 需要替换  x= a?b:c 这个赋值语句为 if 语句
                let parentVar;
                if (parent.type === 'AssignmentExpression') {
                    parentVar = ast_reduce(parent.left, parent);
                } else if (parent.type === 'VariableDeclarator') {
                    parentVar = ast_reduce(parent.id, parent);
                }

                let block1 = getAssignExpression(parentVar, ast.consequent);
                let block2 = getAssignExpression(parentVar, ast.alternate);

                ret = {
                    type: 'IfStatement',
                    test: ast_reduce_scoped(ast.test), //Expand or Not? Lookahead?
                    consequent: block1,
                    alternate: block2
                };

            } else if (parent.type === 'ReturnStatement') {
                ret = {
                    type: 'IfStatement',
                    test: ast_reduce_scoped(ast.test), //Expand or Not? Lookahead?
                    consequent: getReturnExpression(ast.consequent),
                    alternate: getReturnExpression(ast.alternate)
                };
            }
            else {
                let consequent = ast_reduce_scoped(ast.consequent);
                let alternate = ast_reduce_scoped(ast.alternate);
                ret = {
                    type: 'IfStatement',                 // 转化为if 语句
                    test: ast_reduce_scoped(ast.test), //Expand or Not? Lookahead?
                    consequent: consequent,
                    alternate: alternate
                };
            }

            return ret;

        default:
            return ast;
    }

}

module.exports = {
    deobfuscate: function (ast, parent) {
        reduceContext = {};
        return ast_reduce(ast, parent);
    },
};
