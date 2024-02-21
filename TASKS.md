# TODO

- make lines being able to be selected by dragging onto the margin line numbers
  example : hold drag from line 1 to 25 on the margin number would select line 1 to 25

- make spaces visible const spaceCharacter = "·";
  example: if a line has 4 spaces, replace them by 4 spaceCharacter (·), or make spaces visible with an option to toggle

# TOKEEP

tauri example call backend function from frontend

```js
let greetInputEl;
let greetMsgEl;
async function greet() {
	greetMsgEl.textContent = await invoke("greet", { name: greetInputEl.value });
}
window.addEventListener("DOMContentLoaded", () => {
	greetInputEl = document.querySelector("#greet-input");
	greetMsgEl = document.querySelector("#greet-msg");
	document.querySelector("#greet-form").addEventListener("submit", (e) => {
		e.preventDefault();
		greet();
	});
});
```

random aah
// import { emit, listen } from "@tauri-apps/api/event";

// const unlisten = await listen("event-name", (event) => {
// console.log(event);
// });

// emits the `click` event with the object payload
// emit("click", {
// theMessage: "Tauri is awesome!",
// });
