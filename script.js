// Dropdown menu behavior
document.querySelectorAll(".menu").forEach(menu => {
  const trigger = menu.querySelector(".menu-trigger");
  const dropdown = menu.querySelector(".dropdown");

  let timeout;

  trigger.addEventListener("mouseenter", () => {
    clearTimeout(timeout);
    dropdown.classList.add("open");
  });

  trigger.addEventListener("mouseleave", () => {
    timeout = setTimeout(() => dropdown.classList.remove("open"), 250);
  });

  dropdown.addEventListener("mouseenter", () => {
    clearTimeout(timeout);
    dropdown.classList.add("open");
  });

  dropdown.addEventListener("mouseleave", () => {
    timeout = setTimeout(() => dropdown.classList.remove("open"), 250);
  });
});
