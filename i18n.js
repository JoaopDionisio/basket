// Interface text in each language. Add a language by adding an entry to LANGS and a block to STRINGS
// (plus its names in pantry.json).
window.BASKET_I18N = {
  LANGS: [
    { id: "en", label: "English", locale: "en-GB" },
    { id: "pt", label: "Português (Portugal)", locale: "pt-PT" },
  ],

  STRINGS: {
    en: {
      inventory: "Inventory", shoppingList: "Shopping list", listActions: "List actions",
      pantry: "Pantry", editPantry: "Edit pantry", settings: "Settings", hint: "Tap or drag to add",
      myList: "My list", renameList: "Rename list", unsaved: "Unsaved changes",
      emptyTitle: "Your basket is empty.", emptySub: "Drag something in from the pantry.",
      clear: "Clear", save: "Save", load: "Load", delete: "Delete",
      add: "+ Add", newItem: "New item…", editHint: "Tap a custom item to remove it",
      notSaved: "Not saved yet", savedEmpty: "Saved list · empty", toBuy: "{n} to buy", inBasket: " · {n} in the basket",
      markBought: "Mark as bought", remove: "Remove", removed: "Removed {name}", undo: "Undo",
      alreadyEmpty: "Already empty", cleared: "List cleared",
      saveTitle: "Save list", saveSub: "Give it a name so you can find it later.", savedToast: "Saved “{name}” ✓",
      yourLists: "Your lists", pickOne: "Pick one to open.", items_one: "{n} item", items_other: "{n} items",
      noLists: "No saved lists yet.", newList: "+ Start a new list", opened: "Opened “{name}”",
      deleteTitle: "Delete “{name}”?", deleteSub: "This removes the saved list for good.", keep: "Keep it", deleted: "Deleted “{name}”",
      done: "Done", cancel: "Cancel", placeholder: "e.g. Weekly groceries",
      today: "today, {time}", yesterday: "yesterday, {time}",
      language: "Language",
    },
    pt: {
      inventory: "Despensa", shoppingList: "Lista de compras", listActions: "Ações da lista",
      pantry: "Despensa", editPantry: "Editar despensa", settings: "Definições", hint: "Toca ou arrasta para adicionar",
      myList: "A minha lista", renameList: "Mudar o nome da lista", unsaved: "Alterações por guardar",
      emptyTitle: "O teu cesto está vazio.", emptySub: "Arrasta algo da despensa.",
      clear: "Limpar", save: "Guardar", load: "Abrir", delete: "Apagar",
      add: "+ Adicionar", newItem: "Novo produto…", editHint: "Toca num produto teu para o remover",
      notSaved: "Ainda não guardada", savedEmpty: "Lista guardada · vazia", toBuy: "{n} por comprar", inBasket: " · {n} no cesto",
      markBought: "Marcar como comprado", remove: "Remover", removed: "Removido: {name}", undo: "Anular",
      alreadyEmpty: "Já está vazia", cleared: "Lista limpa",
      saveTitle: "Guardar lista", saveSub: "Dá-lhe um nome para a encontrares mais tarde.", savedToast: "«{name}» guardada ✓",
      yourLists: "As tuas listas", pickOne: "Escolhe uma para abrir.", items_one: "{n} produto", items_other: "{n} produtos",
      noLists: "Ainda não tens listas guardadas.", newList: "+ Começar uma lista nova", opened: "«{name}» aberta",
      deleteTitle: "Apagar «{name}»?", deleteSub: "A lista guardada é apagada de vez.", keep: "Manter", deleted: "«{name}» apagada",
      done: "Concluído", cancel: "Cancelar", placeholder: "ex.: Compras da semana",
      today: "hoje, {time}", yesterday: "ontem, {time}",
      language: "Idioma",
    },
  },
};
