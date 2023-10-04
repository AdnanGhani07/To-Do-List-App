//jshint esversion:6

const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-adnan:adnanghani07@cluster0.xlemody.mongodb.net/todolistDB", { useNewUrlParser: true });

const itemsSchema = {
  name: String
};

const items = [];

const Item = mongoose.model("item", itemsSchema);

const item1 = new Item({
  name: "Welcome to the To Do List!"
});

const item2 = new Item({
  name: "Use the + button to add a new task."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {

  Item.find({}).then(function (foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems);
      console.log("Successfully saved items to DB");
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  })
    .catch(function (err) {
      console.log(err);
    });
});

app.get("/:customListname", function (req, res) {
  const customListName = _.capitalize(req.params.customListname);

  List.findOne({ name: customListName }).then(function (foundList) {
    if (!foundList) {
      //Create a new list
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save();
      res.redirect("/" + customListName);
    } else {
      //Show an existing list
      res.render("list", { listTitle: foundList.name, newListItems: foundList.items })
    }
  });
});

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }).then(function (foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }


});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
      .then(function () {
        console.log("successfully deleted item from today's list");
      })
      .catch(function (err) {
        console.log(err);
      });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } })
      .then(function () {
        console.log("Successfully deleted item from custom list");
      })
      .catch(function (err) {
        console.log(err);
      });
    res.redirect("/" + listName);
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
