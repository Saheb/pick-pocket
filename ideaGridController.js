var controller = {
    loadData: function(filter) {
        return $.ajax({
            type: "GET",
            url: "/items",
            data: filter
        });
    },
    
    insertItem: function(item) {
        return $.ajax({
            type: "POST",
            url: "/items",
            data: item
        });
    },
    
    updateItem: function(item) {
        return $.ajax({
            type: "PUT",
            url: "/items",
            data: item
        });
    },
    
    deleteItem: function(item) {
        return $.ajax({
            type: "DELETE",
            url: "/items",
            data: item
        });
    },
}