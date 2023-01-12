const deleteProduct = async function () {
  const productId = this.parentNode.querySelector("[name=productId]").value;
  const csrfToken = this.parentNode.querySelector("[name=_csrf]").value;
  try {
    const result = await fetch(`/admin/product/${productId}`, {
      method: "delete",
      headers: {
        "csrf-token": csrfToken,
      },
    });
    const data = await result.json();
    if (data.message == "Product deleted Successfully") {
      const parentEl = this.closest("article");
      parentEl.parentNode.removeChild(parentEl);
    }
  } catch (error) {
    console.error(error);
  }
};

const btn = document.querySelector(".btn--delete");

btn.addEventListener("click", deleteProduct);
