import { writable } from "svelte/store";

export const list = writable(["test", "test2"]) 
list.subscribe((value) => localStorage.list = value)
