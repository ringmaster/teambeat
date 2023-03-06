// Define the lists of adjectives and animals
const adjectives = ['happy', 'sad', 'funny', 'silly', 'crazy', 'grumpy', 'angry', 'excited', 'bored', 'hungry', 'thirsty', 'tired', 'sleepy', 'lazy', 'brave', 'scared', 'shy', 'proud', 'jealous', 'curious'];
const animals = ['dog', 'cat', 'elephant', 'lion', 'tiger', 'giraffe', 'monkey', 'zebra', 'hippo', 'crocodile', 'panda', 'koala', 'kangaroo', 'rhino', 'gorilla', 'penguin', 'otter', 'seal', 'dolphin', 'whale'];

// Export the function to generate a random "adjective animal" string
export default function() {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  return `${capitalizeFirstLetter(adjective)} ${capitalizeFirstLetter(animal)}`;
};

// Define a helper function to capitalize the first letter of a string
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
