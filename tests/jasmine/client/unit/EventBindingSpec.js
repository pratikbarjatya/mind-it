describe('eventBinding.js', function () {

  describe('App.eventBinding scoped functions', function () {
    describe('App.eventBinding.focusAfterDelete', function () {
      it("should select next node of deleted node if it exists", function () {
        var next = {_id: "next"},
          previous = {_id: "previous"},
          parent = {_id: "parent", children: [previous, next]},
          removedNode = {_id: "removed", parent: parent, next: next, previous: previous};
        spyOn(App, 'selectNode');

        App.eventBinding.focusAfterDelete(removedNode, 1);

        expect(App.selectNode).toHaveBeenCalledWith(next);
      });

      it("should select previous node of deleted node if it exists and next node does not exist", function () {
        var previous = {_id: "previous"},
          parent = {_id: "parent", children: [previous]},
          removedNode = {_id: "removed", parent: parent, previous: previous};
        spyOn(App, 'selectNode');

        App.eventBinding.focusAfterDelete(removedNode, 1);

        expect(App.selectNode).toHaveBeenCalledWith(previous);
      });

      it("should select parent node of deleted node if it exists after and next & previous nodes do not exist", function () {
        var parent = {_id: "parent", children: []},
          removedNode = {_id: "removed", parent: parent};
        spyOn(App, 'selectNode');

        App.eventBinding.focusAfterDelete(removedNode, 1);

        expect(App.selectNode).toHaveBeenCalledWith(parent);
      });
    });
    describe('App.eventBinding.findSameLevelChild', function () {
      it("should return passed node as sameLevelChild if it does not have children", function () {
        var node = {};
        expect(App.eventBinding.findSameLevelChild(node, 2, 0)).toBe(node);
      });
      it("should return passed node as sameLevelChild if it has same depth", function () {
        var node = {depth: 2, children: []};
        expect(App.eventBinding.findSameLevelChild(node, 2, 0)).toBe(node);
      });
    });
    describe('App.eventBinding.performLogicalVerticalMovement', function () {
      it("should select downward node on performing vertical movement for down key press action", function () {
        var first = {_id: "first", depth: 1, position: "right"},
          second = {_id: "second", depth: 1, position: "right"},
          parent = {_id: "parent", children: [first, second]};
        first.parent = parent;

        spyOn(App, "selectNode");
        App.eventBinding.performLogicalVerticalMovement(first, App.eventBinding.KeyPressed.DOWN);

        expect(App.selectNode).toHaveBeenCalledWith(second);
      });
      it("should select upward node on performing vertical movement for up key press action", function () {
        var first = {_id: "first", depth: 1, position: "right"},
          second = {_id: "second", depth: 1, position: "right"},
          parent = {_id: "parent", children: [first, second]};
        second.parent = parent;

        spyOn(App, "selectNode");
        App.eventBinding.performLogicalVerticalMovement(second, App.eventBinding.KeyPressed.UP);

        expect(App.selectNode).toHaveBeenCalledWith(first);
      });
    });
    describe('event binding helpers', function(){
      var first, second, parent;
      beforeEach(function () {
        first = {_id: "first", depth: 1, position: "right", __data__: "testData"};
        second = {_id: "second", depth: 1, position: "right", __data__: null};
        parent = {_id: "parent", children: [first, second]};
        second.parent = parent;
      });

      it('should call beforeBindEventAction and case action in bindEventAction', function () {
        spyOn(App.eventBinding, 'beforeBindEventAction').and.returnValue(first.__data__);
        spyOn(App.eventBinding, 'caseAction');
        App.eventBinding.bindEventAction();
        expect(App.eventBinding.beforeBindEventAction).toHaveBeenCalled();
        expect(App.eventBinding.caseAction).toHaveBeenCalled();
      });

      it('should call beforeBindEventAction and should not call case action in bindEventAction', function () {
        spyOn(App.eventBinding, 'beforeBindEventAction').and.returnValue(second.__data__);
        spyOn(App.eventBinding, 'caseAction');
        App.eventBinding.bindEventAction();
        expect(App.eventBinding.beforeBindEventAction).toHaveBeenCalled();
        expect(App.eventBinding.caseAction).not.toHaveBeenCalled();
      });

      it('should call selectNode and setPrevDepth in afterBindEventAction', function(){
        spyOn(App, 'selectNode');
        spyOn(App.nodeSelector, 'setPrevDepth');
        App.eventBinding.afterBindEventAction(first);
        expect(App.selectNode).toHaveBeenCalledWith(first);
        expect(App.nodeSelector.setPrevDepth).toHaveBeenCalledWith(first.depth);
      });

    });
  });

  describe('App.cutNode', function () {
    it("should show alert if I try to cut root node", function () {
      spyOn(App.map, "getDataOfNodeWithClassNamesString");
      spyOn(window, "alert");

      App.cutNode();

      expect(window.alert).toHaveBeenCalled();
    });

    it("should call all internal methods on cutNode call for node other than root", function () {
      var parent = {_id: "parent"},
        node = {_id: "node", position: "right", parent: parent};
      spyOn(App.map, "getDataOfNodeWithClassNamesString").and.returnValue(node);
      spyOn(App.map, "storeSourceNode");
      spyOn(Meteor, "call");

      App.cutNode();

      expect(App.map.getDataOfNodeWithClassNamesString).toHaveBeenCalledWith(".selected");
      expect(App.map.storeSourceNode).toHaveBeenCalledWith(node);
      expect(Meteor.call.calls.mostRecent().args[0]).toBe("deleteNode");
    });
  });

  describe("Node Add/Delete/Collapse events", function () {
    var event, node, newNode, parent;
    beforeEach(function () {
      var fixture = '<div id="mindmap"> ' +
        '<svg xmlns="http://www.w3.org/2000/svg" version="1.2" width="28800" height="9300"> ' +
        '<g transform="translate(14400,4650)"><g transform="translate(0,0)" class="node level-0 selected">' +
        '<ellipse rx="125.859375" ry="28.834375" class="root-ellipse"></ellipse>' +
        '<rect x="-95.859375" y="-18.5" width="191.71875" height="29.5"></rect>' +
        '<text cols="60" rows="4" y="9">' +
        '<tspan x="0" dy="0">New Mindmap</tspan>' +
        '</text></g></g></svg> ' +
        '</div>';
      setFixtures(fixture);

      event = document.createEvent("Events");
      event.initEvent("keydown", true, true);

      node = {_id: "node", position: "right"};
      parent = {_id: "parent", position: "right", children: [node]};
      newNode = {_id: "newNode"};
      node.parent = parent;
    });
    describe("New Node creation", function () {
      it("should add new sibling on enter keypress", function () {
        event.keyCode = 13;
        spyOn(App.eventBinding, "newNodeAddAction");

        document.getElementsByClassName("node level-0")[0].dispatchEvent(event);

        expect(App.eventBinding.newNodeAddAction).toHaveBeenCalled();
      });

      it("should call all the functions in enterAction function flow", function () {
        spyOn(App, "calculateDirection").and.returnValue(parent.position);
        spyOn(App.map, "addNewNode").and.returnValue(newNode);

        App.eventBinding.enterAction(node);

        expect(App.calculateDirection).toHaveBeenCalledWith(parent);
        expect(App.map.addNewNode).toHaveBeenCalledWith(parent, "", parent.position, node);
      });

      it("should call all the functions in afterNewNodeAddition function flow ", function () {
        spyOn(App, "deselectNode");
        spyOn(App.map, "makeEditable");
        spyOn(App.eventBinding, "escapeOnNewNode");

        App.eventBinding.afterNewNodeAddition(newNode, node);

        expect(App.deselectNode).toHaveBeenCalled();
        expect(App.map.makeEditable).toHaveBeenCalled();
        expect(App.eventBinding.escapeOnNewNode).toHaveBeenCalled();
      });

      it("should add new child on tab keypress", function () {
        event.keyCode = 9;

        spyOn(App.eventBinding, "newNodeAddAction");
        document.getElementsByClassName("node level-0")[0].dispatchEvent(event);

        expect(App.eventBinding.newNodeAddAction).toHaveBeenCalled();
      });

      it("should call all the functions in tabAction function flow", function () {
        spyOn(App, "calculateDirection").and.returnValue(node.position);
        spyOn(App.map, "addNewNode").and.returnValue(newNode);

        App.eventBinding.tabAction(node);

        expect(App.calculateDirection).toHaveBeenCalledWith(node);
        expect(App.map.addNewNode).toHaveBeenCalledWith(node, "", node.position);
      });

      it("should call all the functions in newNodeAddAction function flow for enter action", function () {
        spyOn(App.map, "getDataOfNodeWithClassNamesString").and.returnValue(node);
        spyOn(App.eventBinding, "enterAction").and.returnValue(newNode);
        spyOn(App.eventBinding, "afterNewNodeAddition");

        App.eventBinding.newNodeAddAction(App.eventBinding.enterAction);

        expect(App.map.getDataOfNodeWithClassNamesString).toHaveBeenCalledWith(".node.selected");
        expect(App.eventBinding.enterAction).toHaveBeenCalled();
        expect(App.eventBinding.afterNewNodeAddition).toHaveBeenCalledWith(newNode, node);
      });

      it("should call all the functions in newNodeAddAction function flow for tab action", function () {
        spyOn(App.map, "getDataOfNodeWithClassNamesString").and.returnValue(node);
        spyOn(App.eventBinding, "tabAction").and.returnValue(newNode);
        spyOn(App.eventBinding, "afterNewNodeAddition");

        App.eventBinding.newNodeAddAction(App.eventBinding.tabAction);

        expect(App.map.getDataOfNodeWithClassNamesString).toHaveBeenCalledWith(".node.selected");
        expect(App.eventBinding.tabAction).toHaveBeenCalled();
        expect(App.eventBinding.afterNewNodeAddition).toHaveBeenCalledWith(newNode, node);
      });
    });

    describe("Node deletion", function () {
      beforeEach(function () {
        spyOn(App.map, "getDataOfNodeWithClassNamesString").and.returnValue(node);
      });
      it("should call all the functions in delete keypress", function () {
        event.keyCode = 46;
        spyOn(Meteor, "call");
        spyOn(App, "getDirection").and.returnValue(node.position);

        document.getElementsByClassName("node")[0].dispatchEvent(event);

        expect(Meteor.call.calls.mostRecent().args[0]).toBe("deleteNode");
      });

      it("should display alert when delete key is pressed on root node", function () {
        event.keyCode = 46;
        spyOn(window, "alert");
        spyOn(App, "getDirection").and.returnValue("root");

        document.getElementsByClassName("node level-0")[0].dispatchEvent(event);

        expect(window.alert).toHaveBeenCalled();
      });

      afterEach(function () {
        expect(App.map.getDataOfNodeWithClassNamesString).toHaveBeenCalledWith(".node.selected");
        expect(App.getDirection).toHaveBeenCalledWith(node);
      });
    });

    it("should toggle collapsing of nodes on space key press", function () {
      event.keyCode = 32;
      spyOn(App.eventBinding, "beforeBindEventAction").and.returnValue(node);
      spyOn(App, "toggleCollapsedNode");
      document.getElementsByClassName("node")[0].dispatchEvent(event);
      expect(App.eventBinding.beforeBindEventAction).toHaveBeenCalled();
      expect(App.toggleCollapsedNode).toHaveBeenCalled();
    });
  });

  describe("Node navigation events", function () {
    var event, node, newNode, parent;
    beforeEach(function () {
      var fixture = '<div id="mindmap"> ' +
        '<svg xmlns="http://www.w3.org/2000/svg" version="1.2" width="28800" height="9300"> ' +
        '<g transform="translate(14400,4650)"><g transform="translate(0,0)" class="node level-0 selected">' +
        '<ellipse rx="125.859375" ry="28.834375" class="root-ellipse"></ellipse>' +
        '<rect x="-95.859375" y="-18.5" width="191.71875" height="29.5"></rect>' +
        '<text cols="60" rows="4" y="9">' +
        '<tspan x="0" dy="0">New Mindmap</tspan>' +
        '</text></g></g></svg> ' +
        '</div>';
      setFixtures(fixture);

      event = document.createEvent("Events");
      event.initEvent("keydown", true, true);

      node = {_id: "node", position: "right"};
      parent = {_id: "parent", position: "right", children: [node]};
      newNode = {_id: "newNode"};
      node.parent = parent;
    });

    describe("Up/Down", function () {
      it("should call bindEventAction with appropriate params on up key press", function () {
        event.keyCode = 38;
        spyOn(App.eventBinding, "bindEventAction");

        document.getElementsByClassName("node level-0")[0].dispatchEvent(event);

        expect(App.eventBinding.bindEventAction.calls.mostRecent().args[0]).toEqual(event);
        expect(App.eventBinding.bindEventAction.calls.mostRecent().args[1]).toEqual(App.eventBinding.performLogicalVerticalMovement);
        expect(App.eventBinding.bindEventAction.calls.mostRecent().args[2]).toEqual(App.eventBinding.performLogicalVerticalMovement);
        expect(App.eventBinding.bindEventAction.calls.mostRecent().args[4]).toEqual(App.eventBinding.KeyPressed.UP);
        expect(App.eventBinding.bindEventAction.calls.mostRecent().args.length).toEqual(5);

      });
      it("should call bindEventAction with appropriate params on down key press", function () {
        event.keyCode = 40;
        spyOn(App.eventBinding, "bindEventAction");

        document.getElementsByClassName("node level-0")[0].dispatchEvent(event);

        expect(App.eventBinding.bindEventAction.calls.mostRecent().args[0]).toEqual(event);
        expect(App.eventBinding.bindEventAction.calls.mostRecent().args[1]).toEqual(App.eventBinding.performLogicalVerticalMovement);
        expect(App.eventBinding.bindEventAction.calls.mostRecent().args[2]).toEqual(App.eventBinding.performLogicalVerticalMovement);
        expect(App.eventBinding.bindEventAction.calls.mostRecent().args[4]).toEqual(App.eventBinding.KeyPressed.DOWN);
        expect(App.eventBinding.bindEventAction.calls.mostRecent().args.length).toEqual(5);
      });
    });

    describe("Left/Right", function () {
      it("should call bindEventAction with appropriate params on left key press", function () {
        event.keyCode = 37;
        spyOn(App.eventBinding, "bindEventAction");

        document.getElementsByClassName("node level-0")[0].dispatchEvent(event);

        expect(App.eventBinding.bindEventAction.calls.mostRecent().args[0]).toEqual(event);
        expect(App.eventBinding.bindEventAction.calls.mostRecent().args[1]).toEqual(App.eventBinding.handleCollapsing);
        expect(App.eventBinding.bindEventAction.calls.mostRecent().args[2]).toEqual(App.eventBinding.getParentForEventBinding);
        expect(App.eventBinding.bindEventAction.calls.mostRecent().args[4]).toEqual(App.eventBinding.KeyPressed.LEFT);
        expect(App.eventBinding.bindEventAction.calls.mostRecent().args.length).toEqual(5);
      });


      it("should call bindEventAction with appropriate params on right key press", function () {
        event.keyCode = 39;
        spyOn(App.eventBinding, "bindEventAction");

        document.getElementsByClassName("node level-0")[0].dispatchEvent(event);

        expect(App.eventBinding.bindEventAction.calls.mostRecent().args[0]).toEqual(event);
        expect(App.eventBinding.bindEventAction.calls.mostRecent().args[1]).toEqual(App.eventBinding.getParentForEventBinding);
        expect(App.eventBinding.bindEventAction.calls.mostRecent().args[2]).toEqual(App.eventBinding.handleCollapsing);
        expect(App.eventBinding.bindEventAction.calls.mostRecent().args[4]).toEqual(App.eventBinding.KeyPressed.RIGHT);
        expect(App.eventBinding.bindEventAction.calls.mostRecent().args.length).toEqual(5);
      });
    });
  });
});