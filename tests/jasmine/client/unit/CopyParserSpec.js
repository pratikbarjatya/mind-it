describe("Create Bulleted List from Node", function () {
    var rootNode, rightSubNode, leftSubNode, rightLeafNode, leftLeafNode;
    beforeEach(function () {
        rootNode = new App.Node("root");
        rootNode._id = "rootNode";

        rightSubNode = new App.Node("right", App.Constants.Direction.RIGHT̰, rootNode, 0);
        rightSubNode._id = "rightSubNode";
        rightSubNode.parent = rootNode;

        leftSubNode = new App.Node("left", App.Constants.Direction.LEFT, rootNode, 0);
        leftSubNode._id = "leftSubNode";
        leftSubNode.parent = rootNode;

        rightLeafNode = new App.Node("right leaf", App.Constants.Direction.RIGHT, rightSubNode, 1);
        rightLeafNode._id = "rightLeafNode";
        rightLeafNode.parent = rightSubNode;
        rightLeafNode.childSubTree = [];

        leftLeafNode = new App.Node("left leaf", App.Constants.Direction.LEFT, leftSubNode, 1);
        leftLeafNode._id = "leftLeafNode";
        leftLeafNode.parent = leftSubNode;
        leftLeafNode.childSubTree = [];

        rootNode.left = [leftSubNode];
        rootNode.right = [rightSubNode];

        rightSubNode.childSubTree = [rightLeafNode];
        leftSubNode.childSubTree = [leftLeafNode];
    });

    it("Should return empty string when no node object is passed", function () {
        var actual = App.CopyParser.populateBulletedFromObject();

        expect(actual).toEqual("");
    });

    it("Should return bulleted list starting from root node when root node is passed", function () {
        var actual = App.CopyParser.populateBulletedFromObject(rootNode);

        expect(actual).toEqual('root\n\tright\n\t\tright leaf\n\tleft\n\t\tleft leaf');
    });

    it("Should return node name when leaf node is passed", function () {
        var actual = App.CopyParser.populateBulletedFromObject(rightLeafNode);

        expect(actual).toEqual('right leaf');
    });

    it("Should return node name when node name has line break", function () {
        var rightLeafNodeWithLineBreakInNodeName = new App.Node('aashish\nsingh', App.Constants.Direction.RIGHT, rightSubNode, 1);
        rightLeafNodeWithLineBreakInNodeName._id = 'rightLeafNodeWithLineBreakInNodeName';
        rightLeafNodeWithLineBreakInNodeName.parent = rightSubNode;
        rightLeafNodeWithLineBreakInNodeName.childSubTree = [];

        var actual = App.CopyParser.populateBulletedFromObject(rightLeafNodeWithLineBreakInNodeName);

        expect(actual).toEqual('aashish‡singh');
    });

    it("Should return node name node name as empty string", function () {
        var emptyStringRightNode = new App.Node('', App.Constants.Direction.RIGHT, rightSubNode, 1);
        emptyStringRightNode._id = 'emptyStringRightNode';
        emptyStringRightNode.parent = rightSubNode;
        emptyStringRightNode.childSubTree = [];

        var actual = App.CopyParser.populateBulletedFromObject(emptyStringRightNode);

        expect(actual).toEqual('§');
    });

    it("Should return bulleted list starting sub node when sub node is passed", function () {
        var actual = App.CopyParser.populateBulletedFromObject(leftSubNode);

        expect(actual).toEqual('left\n\tleft leaf');
    });
});

describe("Create Node from Bulleted list", function () {
    var rootNode, rightSubNode, leftSubNode, rightLeafNode, leftLeafNode, mindmapService;

    beforeEach(function () {
        rootNode = new App.Node("root");
        rootNode._id = "rootNode";

        rightSubNode = new App.Node("right", App.Constants.Direction.RIGHT̰, rootNode, 0);
        rightSubNode._id = "rightSubNode";
        rightSubNode.parent = rootNode;

        leftSubNode = new App.Node("left", App.Constants.Direction.LEFT, rootNode, 0);
        leftSubNode._id = "leftSubNode";
        leftSubNode.parent = rootNode;

        rightLeafNode = new App.Node("right leaf", App.Constants.Direction.RIGHT, rightSubNode, 1);
        rightLeafNode._id = "rightLeafNode";
        rightLeafNode.parent = rightSubNode;

        leftLeafNode = new App.Node("left leaf", App.Constants.Direction.LEFT, leftSubNode, 1);
        leftLeafNode._id = "leftLeafNode";
        leftLeafNode.parent = leftSubNode;

        rootNode.left = [leftSubNode];
        rootNode.right = [rightSubNode];

        rightSubNode.childSubTree = [rightLeafNode];
        leftSubNode.childSubTree = [leftLeafNode];

        mindmapService = App.MindMapService.getInstance();

        spyOn(mindmapService, "addNode").and.callFake(function (node) {
            return node.name;
        });

        spyOn(mindmapService, "updateNode");
    });

    it("Should return no Object for empty Bulleted List", function () {
        var bulletedList = "";

        expect(rightLeafNode.childSubTree.length).toEqual(0);

        App.CopyParser.populateObjectFromBulletedList(bulletedList, rightLeafNode);

        expect(rightLeafNode.childSubTree.length).toEqual(0);
    });

    it("Should append child id to parent, call addNode and updateNode for child and parent respectively", function () {
        var bulletedList = "child1";

        var actual = App.CopyParser.populateObjectFromBulletedList(bulletedList, rightLeafNode);
        var expected = {name: bulletedList, left: [], right: [], childSubTree: [], position: "childSubTree"};

        expect(actual.name).toEqual(expected.name);
        expect(actual.left).toEqual(expected.left);
        expect(actual.right).toEqual(expected.right);
        expect(actual.childSubTree).toEqual(expected.childSubTree);
        expect(actual.position).toEqual(expected.position);
        expect(actual.parent).toEqual(rightLeafNode);
    });

    it("Should append to the child of parent", function () {
        var bulletedList = "child1\nchild2";

        var actual = App.CopyParser.populateObjectFromBulletedList(bulletedList, rightLeafNode);
        var expected = {name: "child1", left: [], right: [], childSubTree: [], position: "childSubTree"};

        expect(actual.name).toEqual("child1");
        expect(actual.left).toEqual(expected.left);
        expect(actual.right).toEqual(expected.right);
        expect(actual.childSubTree).toEqual(expected.childSubTree);
        expect(actual.position).toEqual(expected.position);
        expect(actual.parent).toEqual(rightLeafNode);
    });

    it("Should properly parse for level 2 children", function () {
        var bulletedList = "child1\nchild2\n\tchild2.1\n\tchild2.2\nchild3";

        App.CopyParser.populateObjectFromBulletedList(bulletedList, rightLeafNode);

        expect(mindmapService.addNode.calls.mostRecent().args[0].parentId).toEqual("child2");
        expect(mindmapService.updateNode.calls.mostRecent().args[1].childSubTree[1]).toEqual("child2.2");
        expect(mindmapService.updateNode.calls.argsFor(0)[1].childSubTree).toEqual(["child1", "child2", "child3"]);
    });

    it("Should properly parse for level 2 children for two level 1 nodes with children", function () {
        var bulletedList = "child1\nchild2\n\tchild2.1\n\tchild2.2\nchild3\n\tchild3.1\n\tchild3.2\nchild4";

        App.CopyParser.populateObjectFromBulletedList(bulletedList, rightLeafNode);

        expect(mindmapService.addNode.calls.mostRecent().args[0].parentId).toEqual("child3");
        expect(mindmapService.updateNode.calls.mostRecent().args[1].childSubTree[1]).toEqual("child3.2");
        expect(mindmapService.updateNode.calls.argsFor(1)[1].childSubTree).toEqual(["child2.1", "child2.2"]);
    });

    it("Should properly parse for level 3 children", function () {
        var bulletedList = "child1\nchild2\n\tchild2.1\n\tchild2.2\nchild3\n\tchild3.1\n\t\tchild3.1.1\n\tchild3.2\nchild4";

        App.CopyParser.populateObjectFromBulletedList(bulletedList, rightLeafNode);

        expect(mindmapService.addNode.calls.mostRecent().args[0].parentId).toEqual("child3.1");
        expect(mindmapService.updateNode.calls.mostRecent().args[1].childSubTree[0]).toEqual("child3.1.1");
        expect(mindmapService.updateNode.calls.argsFor(1)[1].childSubTree).toEqual(["child2.1", "child2.2"]);
        expect(mindmapService.updateNode.calls.argsFor(2)[1].childSubTree).toEqual(["child3.1", "child3.2"]);
    });

    it("Should properly parse for children with multiple tabs", function () {
        var bulletedList = "child1\nchild2\n\t\t\t\tchild2.1\n\tchild2.2\nchild3\n\t\t\t\tchild3.1\n\t\t\t\t\tchild3.1.1\n\tchild3.2\nchild4";

        App.CopyParser.populateObjectFromBulletedList(bulletedList, rightLeafNode);

        expect(mindmapService.addNode.calls.mostRecent().args[0].parentId).toEqual("child3.1");
        expect(mindmapService.updateNode.calls.mostRecent().args[1].childSubTree[0]).toEqual("child3.1.1");
        expect(mindmapService.updateNode.calls.argsFor(1)[1].childSubTree).toEqual(["child2.1", "child2.2"]);
        expect(mindmapService.updateNode.calls.argsFor(2)[1].childSubTree).toEqual(["child3.1", "child3.2"]);
    });

    it("Should properly parse for children with multiple tabs with carriage return", function () {
        var bulletedList = "child1\n\rchild2\n\r\t\t\t\tchild2.1\n\r\tchild2.2\n\rchild3\n\r\t\t\t\tchild3.1\n\r\t\t\t\t\tchild3.1.1\n\r\tchild3.2\n\rchild4";

        App.CopyParser.populateObjectFromBulletedList(bulletedList, rightLeafNode);

        expect(mindmapService.addNode.calls.mostRecent().args[0].parentId).toEqual("child3.1");
        expect(mindmapService.updateNode.calls.mostRecent().args[1].childSubTree[0]).toEqual("child3.1.1");
        expect(mindmapService.updateNode.calls.argsFor(1)[1].childSubTree).toEqual(["child2.1", "child2.2"]);
        expect(mindmapService.updateNode.calls.argsFor(2)[1].childSubTree).toEqual(["child3.1", "child3.2"]);
    });
});

describe('HTML formatting for pasting as HTML', function () {
    var rootNode, rightSubNodeLevel1, rightSubNodeLevel2, rightSubNodeLevel3, leftSubNode, rightLeafNode, firstLeftLeafNode, secondLeftLeafNode;

    beforeEach(function () {
        rootNode = new App.Node("root");
        rootNode._id = "rootNode";

        var rootNodeData = {};
        rootNodeData.name = rootNode.name;
        rootNodeData.childSubTree = [];

        rootNode.__data__ = rootNodeData;

        rightSubNodeLevel1 = new App.Node("right sub node level 1", App.Constants.Direction.RIGHT̰, rootNode, 0);
        rightSubNodeLevel1._id = "rightSubNodeLevel1";
        rightSubNodeLevel1.parent = rootNode;

        var rightSubNodeLevel1Data = {};
        rightSubNodeLevel1Data.name = rightSubNodeLevel1.name;
        rightSubNodeLevel1Data.left = [];
        rightSubNodeLevel1Data.right = [];

        rightSubNodeLevel1.__data__ = rightSubNodeLevel1Data;

        rightSubNodeLevel2 = new App.Node("right sub node level 2", App.Constants.Direction.RIGHT̰, rightSubNodeLevel1, 0);
        rightSubNodeLevel2._id = "rightSubNodeLevel2";
        rightSubNodeLevel2.parent = rightSubNodeLevel1;

        var rightSubNodeLevel2Data = {};
        rightSubNodeLevel2Data.name = rightSubNodeLevel2.name;
        rightSubNodeLevel2Data.left = [];
        rightSubNodeLevel2Data.right = [];

        rightSubNodeLevel2.__data__ = rightSubNodeLevel2Data;

        rightSubNodeLevel3 = new App.Node("right sub node level 3", App.Constants.Direction.RIGHT̰, rightSubNodeLevel2, 0);
        rightSubNodeLevel3._id = "rightSubNodeLevel3";
        rightSubNodeLevel3.parent = rightSubNodeLevel2;

        var rightSubNodeLevel3Data = {};
        rightSubNodeLevel3Data.name = rightSubNodeLevel3.name;
        rightSubNodeLevel3Data.left = [];
        rightSubNodeLevel3Data.right = [];

        rightSubNodeLevel3.__data__ = rightSubNodeLevel3Data;

        leftSubNode = new App.Node("left", App.Constants.Direction.LEFT, rootNode, 0);
        leftSubNode._id = "leftSubNode";
        leftSubNode.parent = rootNode;

        var leftSubNodeData = {};
        leftSubNodeData.name = leftSubNode.name;
        leftSubNodeData.parent = rootNode;
        leftSubNodeData.left = [];
        leftSubNodeData.right = [];

        leftSubNode.__data__ = leftSubNodeData;

        rightLeafNode = new App.Node("right leaf", App.Constants.Direction.RIGHT, rightSubNodeLevel3, 1);
        rightLeafNode._id = "rightLeafNode";
        rightLeafNode.parent = rightSubNodeLevel3;

        var rightLeafNodeData = {};
        rightLeafNodeData.name = rightLeafNode.name;
        rightLeafNodeData.left = [];
        rightLeafNodeData.right = [];
        rightLeafNodeData.parentId = rightSubNodeLevel3._id;

        rightLeafNode.__data__ = rightLeafNodeData;

        firstLeftLeafNode = new App.Node("first left leaf", App.Constants.Direction.LEFT, leftSubNode, 1);
        firstLeftLeafNode._id = "firstLeftLeafNode";
        firstLeftLeafNode.parent = leftSubNode;

        var firstLeftLeafNodeData = {};
        firstLeftLeafNodeData.name = firstLeftLeafNode.name;
        firstLeftLeafNodeData.left = [];
        firstLeftLeafNodeData.right = [];
        firstLeftLeafNodeData.childSubTree = [];
        firstLeftLeafNodeData.parentId = "leftSubNode";


        firstLeftLeafNode.__data__ = firstLeftLeafNodeData;

        secondLeftLeafNode = new App.Node("second left leaf", App.Constants.Direction.LEFT, leftSubNode, 1);
        secondLeftLeafNode._id = "secondLeftLeafNode";
        secondLeftLeafNode.parent = leftSubNode;

        var secondLeftLeafNodeData = {};
        secondLeftLeafNodeData.name = secondLeftLeafNode.name;
        secondLeftLeafNodeData.left = [];
        secondLeftLeafNodeData.right = [];
        secondLeftLeafNodeData.childSubTree = [];
        secondLeftLeafNodeData.parentId = "leftSubNode";

        secondLeftLeafNode.__data__ = secondLeftLeafNodeData;

        rootNode.left = [leftSubNode];
        rootNode.right = [rightSubNodeLevel1];

        rootNodeData.left = [leftSubNode];
        rootNodeData.right = [rightSubNodeLevel1];

        rightSubNodeLevel1.childSubTree = [rightSubNodeLevel2];
        rightSubNodeLevel2.childSubTree = [rightSubNodeLevel3];
        rightSubNodeLevel3.childSubTree = [rightLeafNode];

        rightSubNodeLevel1Data.childSubTree = [rightSubNodeLevel2];
        rightSubNodeLevel2Data.childSubTree = [rightSubNodeLevel3];
        rightSubNodeLevel3Data.childSubTree = [rightLeafNode];

        leftSubNode.childSubTree = [firstLeftLeafNode, secondLeftLeafNode];

        leftSubNodeData.childSubTree = [firstLeftLeafNode, secondLeftLeafNode];

        rightLeafNode.childSubTree = [];

        rightLeafNodeData.childSubTree = [];

        firstLeftLeafNode.childSubTree = [];
        secondLeftLeafNode.childSubTree = [];

        firstLeftLeafNodeData.childSubTree = [];
        secondLeftLeafNodeData.childSubTree = [];
    });

    it('Should return empty string when nothing is passed', function () {
        var actual = App.CopyParser.Html();
        var expected = '';

        expect(actual).toBe(expected);
    });

    it('Should return leaf node name when single leaf node selected', function () {
        var plainTextValue = 'first left leaf';
        var selectedNodes = [firstLeftLeafNode];

        var inlineHtmlStyleContents = 'SOME STYLE';

        spyOn(App.CopyParser, 'CssClassValue').and.returnValue(inlineHtmlStyleContents);

        var actual = App.CopyParser.Html(selectedNodes);
        var expected = '<span style=\'' + inlineHtmlStyleContents + '\'>' + plainTextValue + '</span>';

        expect(actual).toBe(expected);
    });

    it('Should return leaf node name(s) when multiple leaf nodes selected', function () {
        var selectedNodes = [firstLeftLeafNode, secondLeftLeafNode];

        var inlineHtmlStyleContents = 'SOME STYLE';

        spyOn(App.CopyParser, 'CssClassValue').and.returnValue(inlineHtmlStyleContents);

        var actual = App.CopyParser.Html(selectedNodes);
        var expected = '<span style=\'' + inlineHtmlStyleContents + '\'>first left leaf</span>' +
            '<span style=\'' + inlineHtmlStyleContents + '\'>second left leaf</span>';

        expect(actual).toBe(expected);
    });

    it('Should return sub node name and leaf node name as bulleted list when single sub node selected', function () {
        var selectedNodes = [rightSubNodeLevel3];

        var inlineHtmlStyleContents = 'SOME STYLE';

        spyOn(App.CopyParser, 'CssClassValue').and.returnValue(inlineHtmlStyleContents);

        var actual = App.CopyParser.Html(selectedNodes);
        var expected = '<span style=\'' + inlineHtmlStyleContents + '\'>right sub node level 3</span>' +
            '<ul list-style-type=\'circle\'>' +
            '<li>' +
            '<span style=\'' + inlineHtmlStyleContents + '\'>right leaf</span>' +
            '</li>' +
            '</ul>';

        expect(actual).toBe(expected);
    });

    xit('Should return sub node name(s) and leaf node name(s) as bulleted list when multiple sub node selected', function () {
        var selectedNodes = [rightSubNodeLevel3, leftSubNode];

        var inlineHtmlStyleContents = 'SOME STYLE';

        spyOn(App.CopyParser, 'CssClassValue').and.returnValue(inlineHtmlStyleContents);

        var actual = App.CopyParser.Html(selectedNodes);
        var expected = '<span style=\'' + inlineHtmlStyleContents + '\'>right sub node level 3</span>' +
            '<ul list-style-type=\'circle\'>' +
            '<li><span style=\'' + inlineHtmlStyleContents + '\'>right leaf</span></li>' +
            '</ul>' +
            '<span style=\'' + inlineHtmlStyleContents + '\'>left</span>' +
            '<ul list-style-type=\'circle\'>' +
            '<li><span style=\'' + inlineHtmlStyleContents + '\'>first left leaf</span></li>' +
            '<li><span style=\'' + inlineHtmlStyleContents + '\'>second left leaf</span></li>' +
            '</ul>';

        expect(actual).toBe(expected);
    });

    xit('Should return root node name, sub node name and leaf node name when root node selected', function () {
        var selectedNodes = [rootNode];

        var inlineHtmlStyleContents = 'SOME STYLE';

        spyOn(App.CopyParser, 'CssClassValue').and.returnValue(inlineHtmlStyleContents);

        var actual = App.CopyParser.Html(selectedNodes);
        var expected = '<span style=\'' + inlineHtmlStyleContents + '\'>root</span>' +
            '<ul list-style-type=\'circle\'>' +
            '<li><span style=\'' + inlineHtmlStyleContents + '\'>right sub node level 1</span>' +
            '<ul list-style-type=\'disc\'>' +
            '<li><span style=\'' + inlineHtmlStyleContents + '\'>right sub node level 2</span>' +
            '<ul list-style-type=\'square\'>' +
            '<li><span style=\'' + inlineHtmlStyleContents + '\'>right sub node level 3</span>' +
            '<ul list-style-type=\'square\'>' +
            '<li><span style=\'' + inlineHtmlStyleContents + '\'>right leaf</span></li>' +
            '</ul>' +
            '</li>' +
            '</ul>' +
            '</li>' +
            '</ul>' +
            '</li>' +
            '</ul>' +
            '<ul list-style-type=\'circle\'>' +
            '<li><span style=\'' + inlineHtmlStyleContents + '\'>left</span>' +
            '<ul list-style-type=\'disc\'>' +
            '<li><span style=\'' + inlineHtmlStyleContents + '\'>first left leaf</span></li>' +
            '<li><span style=\'' + inlineHtmlStyleContents + '\'>second left leaf</span></li>' +
            '</ul>' +
            '</li>' +
            '</ul>';

        expect(actual).toBe(expected);
    });
});

describe('Plain text formatting for pasting as plain text', function () {
    var rootNode, rightSubNode, leftSubNode, rightLeafNode, firstLeftLeafNode, secondLeftLeafNode;

    beforeEach(function () {
        rootNode = new App.Node("root");
        rootNode._id = "rootNode";

        var rootNodeData = {};
        rootNodeData._id = rootNode._id;
        rootNodeData.name = rootNode.name;
        rootNodeData.childSubTree = [];

        rootNode.__data__ = rootNodeData;

        rightSubNode = new App.Node("right", App.Constants.Direction.RIGHT̰, rootNode, 0);
        rightSubNode._id = "rightSubNode";
        rightSubNode.parent = rootNode;

        var rightSubNodeData = {};
        rightSubNodeData._id = rightSubNode._id;
        rightSubNodeData.name = rightSubNode.name;
        rightSubNodeData.left = [];
        rightSubNodeData.right = [];

        rightSubNode.__data__ = rightSubNodeData;

        leftSubNode = new App.Node("left", App.Constants.Direction.LEFT, rootNode, 0);
        leftSubNode._id = "leftSubNode";
        leftSubNode.parent = rootNode;

        var leftSubNodeData = {};
        leftSubNodeData._id = leftSubNode._id;
        leftSubNodeData.name = leftSubNode.name;
        leftSubNodeData.left = [];
        leftSubNodeData.right = [];
        leftSubNodeData.isCollapsed = false;

        leftSubNode.__data__ = leftSubNodeData;

        rightLeafNode = new App.Node("right leaf", App.Constants.Direction.RIGHT, rightSubNode, 1);
        rightLeafNode._id = "rightLeafNode";
        rightLeafNode.parent = rightSubNode;

        firstLeftLeafNode = new App.Node("first left leaf", App.Constants.Direction.LEFT, leftSubNode, 1);
        firstLeftLeafNode._id = "firstLeftLeafNode";
        firstLeftLeafNode.parent = leftSubNode;

        var firstLeftLeafNodeData = {};
        firstLeftLeafNodeData._id = firstLeftLeafNode._id;
        firstLeftLeafNodeData.name = firstLeftLeafNode.name;
        firstLeftLeafNodeData.left = [];
        firstLeftLeafNodeData.right = [];
        firstLeftLeafNodeData.childSubTree = [];

        firstLeftLeafNode.__data__ = firstLeftLeafNodeData;

        secondLeftLeafNode = new App.Node("second left leaf", App.Constants.Direction.LEFT, leftSubNode, 1);
        secondLeftLeafNode._id = "secondLeftLeafNode";
        secondLeftLeafNode.parent = leftSubNode;

        var secondLeftLeafNodeData = {};
        secondLeftLeafNodeData._id = secondLeftLeafNode._id;
        secondLeftLeafNodeData.name = secondLeftLeafNode.name;
        secondLeftLeafNodeData.left = [];
        secondLeftLeafNodeData.right = [];
        secondLeftLeafNodeData.childSubTree = [];

        secondLeftLeafNode.__data__ = secondLeftLeafNodeData;

        rootNode.left = [leftSubNode];
        rootNode.right = [rightSubNode];

        rootNodeData.left = [leftSubNode];
        rootNodeData.right = [rightSubNode];

        rightSubNode.childSubTree = [rightLeafNode];
        leftSubNode.childSubTree = [firstLeftLeafNode, secondLeftLeafNode];

        rightSubNodeData.childSubTree = [rightLeafNode];
        leftSubNodeData.childSubTree = [firstLeftLeafNode, secondLeftLeafNode];
    });

    it('Should return empty string when nothing is passed', function () {
        var actual = App.CopyParser.PlainText();
        var expected = '';

        expect(actual).toBe(expected);
    });

    it('Should return leaf node name when single leaf node passed', function () {
        var actual = App.CopyParser.PlainText(firstLeftLeafNode);
        var expected = 'first left leaf';

        expect(actual).toBe(expected);
    });

    it('Should return leaf node name(s) when multiple leaf node passed', function () {
        var actual = App.CopyParser.PlainText([firstLeftLeafNode, secondLeftLeafNode]);
        var expected = 'first left leaf\nsecond left leaf';

        expect(actual).toBe(expected);
    });

    it('Should return sub node name and leaf node name(s) when single sub node passed', function () {
        var actual = App.CopyParser.PlainText(leftSubNode);
        var expected = 'left\n\tfirst left leaf\n\tsecond left leaf';

        expect(actual).toBe(expected);
    });

    it('Should return sub node name(s) and leaf node name(s) when multiple sub node passed', function () {
        var actual = App.CopyParser.PlainText([leftSubNode, rightSubNode]);
        var expected = 'left\n\tfirst left leaf\n\tsecond left leaf\nright\n\tright leaf';

        expect(actual).toBe(expected);
    });

    it('Should return root node name, sub node name(s) and leaf node name(s) when root node passed', function () {
        var actual = App.CopyParser.PlainText(rootNode);
        var expected = 'root\n\tright\n\t\tright leaf\n\tleft\n\t\tfirst left leaf\n\t\tsecond left leaf';

        expect(actual).toBe(expected);
    });
});