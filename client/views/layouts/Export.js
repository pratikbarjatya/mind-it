Template.ExportImageButton.events({
    'click': function (e, args) {
        e.preventDefault();
        
        var rootName = d3.select(".node.level-0")[0][0].__data__.name;
        App.exportParser.export(rootName);
    }
});