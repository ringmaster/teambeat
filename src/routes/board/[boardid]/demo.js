import { pbStore } from "svelte-pocketbase";
import {get} from 'svelte/store'
import notify from "$utils/notify";
import { v4 } from 'uuid';

let kStore = null

function randomUsername() {
    // Arrays of first and last names
    const firstNames = ["Emma", "Olivia", "Ava", "Isabella", "Sophia", "Mia", "Charlotte", "Amelia", "Harper", "Evelyn", "Abigail", "Emily", "Elizabeth", "Mila", "Ella", "Avery", "Sofia", "Camila", "Aria", "Scarlett"];
    const lastNames = ["Smith", "Johnson", "Williams", "Jones", "Brown", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Perez", "Sanchez", "Jackson", "Lee", "Kim", "Patel", "Singh"];
    
    // Generate random indexes for first and last names
    const firstNameIndex = Math.floor(Math.random() * firstNames.length);
    const lastNameIndex = Math.floor(Math.random() * lastNames.length);
    
    // Return the random name
    return `${firstNames[firstNameIndex]} ${lastNames[lastNameIndex]}`;
}

async function makeDemoUser(anon = false) {
    let promises = [];
    const tempPassword = v4()
    const userdata = {
        "email": `${v4()}@teambeat.dev`,
        "emailVisibility": false,
        "password": tempPassword,
        "passwordConfirm": tempPassword,
        "name": randomUsername(),
        "anonymous": anon,
    };
    
    let user = await kStore.collection('users').create(userdata);
    
    return user;
}

function generateLoremIpsum() {
    const loremIpsum = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";
  
    const words = loremIpsum.split(" ");
    const numWords = Math.floor(Math.random() * 8) + 8; // Select 8-15 words
    const selectedWords = [];
  
    for (let i = 0; i < numWords; i++) {
      const randomIndex = Math.floor(Math.random() * words.length);
      selectedWords.push(words[randomIndex]);
    }
  
    return selectedWords.join(" ");
  }

function makeDemoCard(user, column) {
    const data = {
        "user": user.id,
        "type": "default",
        "description": generateLoremIpsum(),
        "options": "{}",
        "column": column.id
    };
    
    kStore.collection('cards').create(data);
}


export async function addDemoData (board){
    kStore = get(pbStore);
    
    // add some demo users
    let users = []
    users.push(await makeDemoUser());
    board.users.push(users[0].id);
    users.push(await makeDemoUser());
    board.users.push(users[1].id);
    users.push(await makeDemoUser(true));
    board.users.push(users[2].id);
    kStore.collection("boards").update(board.id, board);
    
    // add some demo cards
    for(let z = 0; z < 12; z++) {
        let user = users[Math.floor(Math.random() * users.length)]
        let column = board.columns[Math.floor(Math.random() * board.columns.length)]
        makeDemoCard(user, column)
    }
}
