// Hàm tiền xử lý nội dung để giảm khoảng trắng và dòng trống
export const preprocessContent = (content) => {
  if (!content) return "";
  // Xóa khoảng trắng đầu/cuối dòng, gộp nhiều dấu cách thành một, gộp nhiều dòng trống thành một
  return content
    .split("\n")
    .map((line) => line.trim().replace(/\s+/g, " ")) // Xóa khoảng trắng dư thừa trong mỗi dòng
    .filter((line) => line.length > 0) // Loại bỏ dòng trống
    .join("\n") // Gộp lại với một dòng trống duy nhất
    .trim(); // Xóa khoảng trắng đầu/cuối toàn bộ nội dung
};
