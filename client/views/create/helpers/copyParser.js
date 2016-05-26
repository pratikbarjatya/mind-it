App.CopyParser = {};

App.CopyParser.errorMessage = "";

App.CopyParser.populateBulletedFromObject = function (nodeData, depthOfNode) {
    var returnString = "";

    if (!nodeData) {
        return returnString;
    }

    var depth = depthOfNode ? depthOfNode : 0;
    for (var depthCounter = 1; depthCounter <= depth; depthCounter++) {
        returnString += "\t";
    }

    returnString += getNodeName(nodeData);

    var temp = getSubNodeNames(App.CopyParser.immediateSubNodes(nodeData), depth + 1);

    return temp.length === 0 ? returnString : (returnString + temp);
};

App.CopyParser.immediateSubNodes = function (nodeData) {
    if (App.Node.isRoot(nodeData)) {
        return nodeData.left.concat(nodeData.right);
    }

    return App.Node.getSubTree(nodeData);
};

App.CopyParser.getFormattedText = function (node) {
    var formattedText = '';

    if (!Boolean(node)) {
        return formattedText;
    }

    return node.attr('classed');
};

var getNodeName = function (node) {
    var nodeName = node.name.length === 0 ? "§" : node.name;
    return nodeName.replace(/(\r\n|\n|\r)/gm, "‡");
};

var getSubNodeNames = function (nodes, depth) {
    return nodes.reduce(function (previous, next) {
        return previous + '\n' + App.CopyParser.populateBulletedFromObject(next, depth);
    }, "");
};

var populateObjectFromBulletedList = function (bulletedList, parentNode, expectedDepth) {
    var newNode = null;
    var dir = "childSubTree";
    var expectedDepthStore = expectedDepth;

    if (App.Node.isRoot(parentNode)) {
        dir = App.DirectionToggler.getInstance().getCurrentDirection();
    }

    var childNodeList = [];
    var childNodeSubTree = [];
    var childBulletList = [];
    var headerNodeOfBulletedList = null;
    var siblingIdList = parentNode[dir].map(function (_) {
        return _._id ? _._id : _;
    });

    for (var bulletListCounter = 0; bulletListCounter < bulletedList.length;) {
        var depth = bulletedList[bulletListCounter].split('\t').length - 1;

        if (depth <= expectedDepth || bulletListCounter === 0) {
            if (bulletListCounter === 0) {
                expectedDepth = depth;
            }

            var nodeName = bulletedList[bulletListCounter].split('\t')[depth];

            if (nodeName.length > 0) {
                nodeName = nodeName === "§" ? "" : nodeName;
                nodeName = nodeName.replace(/‡/gm, "\n");
                newNode = new App.Node(nodeName, dir, parentNode, bulletListCounter);

                if (bulletListCounter === 0) {
                    headerNodeOfBulletedList = newNode;
                }

                newNode = App.Node.addToDatabase(newNode);
                siblingIdList.push(newNode._id);
            }

            bulletListCounter++;
        } else {
            childBulletList = [];
            var j = bulletListCounter;
            var childDepth = bulletedList[j].split('\t').length - 1;

            while (childDepth > expectedDepthStore) {
                childBulletList.push(bulletedList[j]);
                j++;

                if (j >= bulletedList.length) {
                    break;
                }

                childDepth = bulletedList[j].split('\t').length - 1;
            }

            j === bulletListCounter ? bulletListCounter++ : bulletListCounter = j;
        }

        if (childBulletList.length > 0) {
            childNodeList[newNode._id] = childBulletList;
            childNodeSubTree[newNode._id] = newNode;
            childBulletList = [];
        }
    }

    App.Node.updateChildTree(parentNode, dir, siblingIdList);

    Object.keys(childNodeList).forEach(function (childNodeId) {
        childBulletList = childNodeList[childNodeId];
        var newParent = childNodeSubTree[childNodeId];

        if (childBulletList && childBulletList.length > 0)
            populateObjectFromBulletedList(childBulletList, newParent, expectedDepthStore + 1);
    });

    return headerNodeOfBulletedList;
};

App.CopyParser.populateObjectFromBulletedList = function (bulletedString, parentNode) {
    if (bulletedString.length > 0) {
        var headerNodeOfBulletedList = populateObjectFromBulletedList(bulletedString.split(/\n\r|\n/), parentNode, 0);
        headerNodeOfBulletedList.parent = parentNode;

        return headerNodeOfBulletedList;
    }
};

App.CopyParser.CopyNodesToClipboard = function (nodes) {
    clipboard.copy({
        "text/plain": App.CopyParser.PlainText(nodes),
        "text/html": ''
    });
};

App.CopyParser.PlainText = function (nodes) {
    var plainTextValue = '';

    if (!Boolean(nodes)) {
        return plainTextValue;
    }

    if (!Array.isArray(nodes)) {
        nodes = [nodes];
    }

    nodes.forEach(function (node) {
        var nodeData = node.__data__;

        plainTextValue += App.CopyParser.populateBulletedFromObject(nodeData) + '\n';
    });

    return plainTextValue.trim();
};

var cssClassName = function (nodeDepth) {
    if (nodeDepth >= 0 && nodeDepth <= 3) {
        return 'level-' + nodeDepth;
    }

    return 'level';
};

var formattedText = function (painTextValue, cssClassInlineValue) {
    return '<p style=\'' + cssClassInlineValue + '\'>' + painTextValue + '</p>';
};

var cssClassValue = function (cssClassName) {
    var cssClassValue = '';

    for (var styleSheetCounter = 0; styleSheetCounter < document.styleSheets.length; styleSheetCounter++) {
        var cssRules = document.styleSheets[styleSheetCounter].cssRules || [];

        var filteredCssRules = filterCssRule(cssRules, cssClassName);

        var firstFilteredCssRule = filteredCssRules[0];

        if (Boolean(firstFilteredCssRule)) {
            var selectorText = firstFilteredCssRule.selectorText;
            var cssText = firstFilteredCssRule.cssText;
            var inlineStyleValue = cssText.replace(selectorText, '');

            if (Boolean(inlineStyleValue)) {
                inlineStyleValue = inlineStyleValue.trim();

                inlineStyleValue = removeCurlyBraces(inlineStyleValue);

                cssClassValue = inlineStyleValue;
            }
        }
    }

    return cssClassValue;
};

var filterCssRule = function (cssRules, cssClassName) {
    return $(cssRules).filter(function (key, value) {
        var selectorText = value.selectorText;

        if (Boolean(selectorText)) {
            var matches = selectorText.match(cssClassName) || [];

            return matches.length > 0;
        }
    });
};

var removeCurlyBraces = function (value) {
    if (Boolean(value)) {
        return value.replace('{', '').replace('}', '');
    }
};