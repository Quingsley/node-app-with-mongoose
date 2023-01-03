const deleteProduct = async (btn) => {
  const productId = btn.parentNode.querySelector("[name=productId]").value;
  const csrfToken = btn.parentNode.querySelector("[name=_csrf]").value;
  try {
    const result = await fetch(`/admin/product/${productId}`, {
      method: "delete",
      headers: {
        "csrf-token": csrfToken,
      },
    });
    const data = await result.json();
    if (data.message == "Product deleted Successfully") {
      const parentEl = btn.closest("article");
      parentEl.parentNode.removeChild(parentEl);
    }
  } catch (error) {
    console.error(error);
  }
};
