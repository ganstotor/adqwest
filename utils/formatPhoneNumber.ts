export const formatPhoneNumber = (value: string): string | null => {
  // Удаляем все нецифровые символы
  const numbers = value.replace(/\D/g, "");

  // Проверяем длину
  if (numbers.length > 10) return null;

  // Форматируем номер в формате (XXX) XXX-XXXX
  if (numbers.length === 0) return "";
  if (numbers.length <= 3) return `(${numbers}`;
  if (numbers.length <= 6)
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
  return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6)}`;
};
