export let userName = "Anonymous";

export const defaultAvatar =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAABmJLR0QA/wD/AP+gvaeTAAACFElEQVRIie3WvWsUURQF8J9REmIgGkyl+BELURCDkiqIoCm0jUhS2Coi2Ij/gLWCIhZBNAiCBBvB2ASCFgasjIqJtiliI1oYoxIsshZzlzzWYWc2rh9FDlxm3n3nnvPmzcydYQ1/CesK5nvQh0M4gG5sxqYIWIj4jI+YwUu8wFwji2nDBUyj8psxHVptZa74CY7F+Sc8xyu8xvvkCheivjPZge3oxUH0y3YInmKg6IqXY7WDaC0i10FraFRCsxDVbWoWcvVaCopacBazWMI8xrAj4eyM3HxwZnCmhHbdFZ7CcXRhF8Zj7k3Cn4nceHC6cCJqa/VKG9eiHVN4luSmItpXoVeXOCR7L7/KXo+hnJp6nFXd42rhcnKet/oynFJG//yp/mPIM16K48aC2r3YV8DpqNGsi3eyrTka425MylpgKjgb0ZHk+4NbbZUDofW2jPH1IN+J8eUYf5B9reC+lXt3L3I9walEDYzG+FoZ417ZE7qErdiAicSoGl+wmJOfiJptobEs+6SWwqMQGYtxp2xbU4MhnK7JzQYXHkTuYVlT2C1rBhUMN1IYGI7aRVkbbQjno/g7DufMd0XU4kjUVHCuUdMqbibmgzVzeY3hZGJ6Y7WmsB63rbTEUWzJMe7GXSs/Ebc0qTldwo8Q/YaRxHgkcpXgXGyGYYo9eOzX16cak9jfbNMUfbgq+3Wdw5XIreH/xE/J/sApz244FAAAAABJRU5ErkJggg==";

export let avatar = defaultAvatar;

export function updateInfo(newUserName, newAvatar) {
  userName = newUserName;
  avatar = newAvatar;

  if (localStorage) {
    localStorage.setItem("userName", newUserName);
    localStorage.setItem("avatar", newAvatar);
  }
}

export function loadInfo() {
  if (localStorage) {
    if (localStorage.getItem("userName") !== null) {
      userName = localStorage.getItem("userName");
      avatar = localStorage.getItem("avatar");
    }
  }
}

export function clearInfo() {
  userName = "Anonymous";
  avatar = defaultAvatar;

  if (localStorage) {
    localStorage.clear();
  }
}
