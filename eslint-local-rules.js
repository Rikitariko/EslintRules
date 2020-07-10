let location = []
let func = []

module.exports = {
    "angular-unused": {
        create: function(context) {
            return {
                Identifier: node => {
                    const ancestors = context.getAncestors(node);
                    const ancestor = ancestors[ancestors.length - 1];

                    if ((ancestor.type !== "MemberExpression" || ancestor.type === "MemberExpression" && ancestor.object.end === node.end) && (ancestor.type !== "FunctionExpression" && ancestor.type !== "FunctionDeclaration")) {
                        for (let i = func.length - 1; i >= 0; i--)
                            for (let j = 0; j < func[i].length; j++)
                                if (func[i][j].name === node.name && location[i].start <= node.start && location[i].end >= node.end)
                                    func[i].splice(j, 1);
                    }
                },
                FunctionExpression: node => {
                    location.push({
                        start: node.start,
                        end: node.end,
                    })
                    func.push(node.params);
                },
                FunctionDeclaration: node => {
                    location.push({
                        start: node.start,
                        end: node.end,
                    })
                    func.push(node.params);
                },

                'Program:exit': function() {
                    for (let i = 0; i < func.length; i++)
                        for (let j = 0; j < func[i].length; j++) {
                            let node = func[i][j];
                            console.log(func[i][j].loc);
                            context.report({
                                loc: { start: node.loc.start, end: node.loc.end},
                                message: `'${node.name}' is defined but never used`
                            });
                        }
                }
            }
        }
    }
};