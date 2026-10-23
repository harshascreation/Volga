const form = document.getElementById("search-form");
const input = document.getElementById("search-input");
const results = document.getElementById("results");
const status = document.getElementById("status");
const emptyState = document.getElementById("empty-state");
let latestSearchId = 0;

async function searchImages(query) {
  const searchId = ++latestSearchId;
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&generator=search" +
    "&gsrsearch=" + encodeURIComponent(query) +
    "&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url&iiurlwidth=600&format=json&origin=*";

  results.innerHTML = "";
  emptyState.hidden = true;
  status.classList.add("is-loading");
  status.setAttribute("aria-busy", "true");
  status.textContent = `Searching for "${query}"...`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Image search failed with status ${response.status}.`);
    }

    const data = await response.json();
    const items = Object.values(data.query?.pages ?? {});

    if (searchId !== latestSearchId) {
      return;
    }

    renderResults(items, query);
  } catch (error) {
    if (searchId !== latestSearchId) {
      return;
    }

    results.innerHTML = "";
    emptyState.textContent = "Something went wrong. Please try again.";
    emptyState.hidden = false;
    status.textContent = "Could not load images. Please try again.";
    console.error(error);
  } finally {
    if (searchId === latestSearchId) {
      status.classList.remove("is-loading");
      status.setAttribute("aria-busy", "false");
    }
  }
}

function renderResults(items, query) {
  results.innerHTML = "";

  const imageItems = items.filter((item) => item.imageinfo?.[0]?.thumburl);

  imageItems.forEach((item) => {
    const card = document.createElement("article");
    card.className = "card";

    const image = document.createElement("img");
    image.src = item.imageinfo[0].thumburl;
    image.alt = item.title;
    image.loading = "lazy";

    const caption = document.createElement("p");
    caption.textContent = item.title.replace(/^File:/, "");

    card.appendChild(image);
    card.appendChild(caption);
    results.appendChild(card);
  });

  status.classList.remove("is-loading");
  status.setAttribute("aria-busy", "false");

  if (imageItems.length === 0) {
    emptyState.textContent = `No images found for "${query}". Try another topic.`;
    emptyState.hidden = false;
    status.textContent = `No results for "${query}".`;
    return;
  }

  emptyState.hidden = true;
  status.textContent = `Showing ${imageItems.length} results for "${query}".`;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = input.value.trim();

  if (!query) {
    return;
  }

  searchImages(query);
});

document.querySelectorAll(".suggestion-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    input.value = chip.textContent.trim();
    form.requestSubmit();
  });
});
