export function cutLastWord(sentence) {
  // Split the sentence into an array of words
  if (!sentence) return;
  let words = sentence.split(" ");

  // Remove the last word from the array
  words.pop();

  // Join the remaining words back into a string with spaces
  let result = words.join(" ");

  return result;
}
