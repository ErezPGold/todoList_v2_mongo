//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const _ = require('lodash');
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


//create new db inside mongoDB - with its new name: todolistDB
const pwd = "test123";
const dbname = "todolistDB";
mongoose.connect("mongodb+srv://admin-erez:" + pwd + "@cluster0.99svl.mongodb.net/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true });

// create item schema with names
const itemsSchema = {
  name: String
};
//new mongoose model 
//(we are going to make items table, Item is the singular form)
const Item = mongoose.model("Item",  itemsSchema);

const item1 = new Item({
  name : "Buy Food",
});
const item2 = new Item({
  name : "Cook Food",
});
const item3 = new Item({
  name : "Eat Food",
});

const defaultItems = [item1, item2, item3]; 

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  
  // find all documents
  Item.find({}, function(err, foundItems){
    // if there are no collections in the db
    if (foundItems.length === 0){
      Item.insertMany(defaultItems, function(err){
        if (err){
          console.log(err);
        } else {
          console.log("Array way successfully inserted to mongoDB");
        }
      });
      //showing the default values:
      res.redirect("/");
    }else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
    
  });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  
  const item = new Item({
    name:itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    //find the list add add the new item:
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    }); 
  }  
});

app.post("/delete", function(req, res){
  const itemIdToDelete = req.body.checkbox;
  const listName = req.body.list;
  
  if (listName === "Today") {
    Item.findByIdAndRemove(itemIdToDelete, function(err){
      if (err){
        console.log("The error is: " + err);
      } else {
        console.log("Deleted successfully.");
        res.redirect("/");
      }
    });  
  } else {
    //find the list add remove the checked item:
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: itemIdToDelete}}}, function(err, foundList){
      if (err){
        console.log("The error is: " + err);
      } else {
        console.log("Deleted successfully.");
        res.redirect("/" + listName);
      }
    });
  }
});

app.get("/:customListName", function(req, res){
  const customListName= _.capitalize(req.params.customListName);
  
  List.findOne({name: customListName}, function(err, foundList){
    if(!err){
      if(!foundList){
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
      
        list.save();

        res.redirect("/" + customListName);
      }
      else {
        //Show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }
    };
  });
  

});

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully.");
});
