/**
 * Centralized Input Validation and Sanitization
 * Protects against XSS, Mass Assignment, Buffer/Payload Exhaustion, and Type Confusion
 */

/**
 * Strips HTML tags and dangerous characters from user input strings
 */
export function sanitizeString(val, maxLength = 255) {
  if (typeof val !== 'string') return '';

  // Strip HTML tags and dangerous script/protocols
  const cleaned = val
    .replace(/<[^>]*>?/gm, '') // Strip HTML tags
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .trim();

  return cleaned.slice(0, maxLength);
}

/**
 * Validates Ukrainian or general international telephone numbers
 */
export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const digits = phone.replace(/[^\d+]/g, '');
  // Must have between 9 and 15 digits
  return /^\+?[0-9]{9,15}$/.test(digits);
}

/**
 * Validates email format if provided (optional field)
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') return true;
  const trimmed = email.trim();
  if (!trimmed) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) && trimmed.length <= 120;
}

/**
 * Validates positive safe integer (e.g. quantity, stock)
 * Strictly requires typeof val === 'number' to reject string quantities
 */
export function validatePositiveInteger(val, min = 1, max = 1000) {
  if (typeof val !== 'number') return null;
  if (!Number.isInteger(val) || !Number.isFinite(val) || isNaN(val) || val < min || val > max) {
    return null;
  }
  return val;
}

/**
 * Validates safe price decimal (must be finite number, >= min)
 * Strictly requires typeof val === 'number'
 */
export function validatePrice(val, min = 0, max = 1000000) {
  if (typeof val !== 'number') return null;
  if (!Number.isFinite(val) || isNaN(val) || val < min || val > max) {
    return null;
  }
  return Math.round(val * 100) / 100;
}

/**
 * Validates product creation/update payload against strict allowlist (Mass Assignment Guard)
 */
export function validateProductPayload(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Недійсний запит товару'], sanitized: {} };
  }

  const name = sanitizeString(data.name, 150);
  if (!name || name.length < 2) {
    errors.push('Назва товару обов’язкова (від 2 до 150 символів)');
  }

  const price = validatePrice(data.price, 0.01, 1000000);
  if (price === null) {
    errors.push('Вкажіть коректну ціну товару (число більше 0)');
  }

  const stock = validatePositiveInteger(data.stock !== undefined ? data.stock : 0, 0, 100000);
  if (stock === null) {
    errors.push('Залишок на складі має бути цілим числом від 0 до 100000');
  }

  const category_id = sanitizeString(data.category_id || '1', 50);
  const category_name = sanitizeString(data.category_name || 'Подарунки ручної роботи', 100);
  const sku = sanitizeString(data.sku, 50);
  const status = ['in_stock', 'out_of_stock', 'pre_order', 'active'].includes(data.status)
    ? data.status
    : 'in_stock';
  const material = sanitizeString(data.material, 100);
  const dimensions = sanitizeString(data.dimensions, 100);
  const production_time = sanitizeString(data.production_time, 100);
  const description = sanitizeString(data.description, 2000);

  // Sanitize images array
  let images = [];
  if (Array.isArray(data.images)) {
    images = data.images
      .filter((img) => typeof img === 'string' && img.trim().length > 0)
      .map((img) => sanitizeString(img, 500000))
      .slice(0, 10);
  }
  if (images.length === 0 && data.image && typeof data.image === 'string') {
    const single = sanitizeString(data.image, 500000);
    if (single) images = [single];
  }
  if (images.length === 0) {
    images = ['/gift_collection.webp'];
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      name,
      price,
      stock,
      category_id,
      category_name,
      sku,
      status,
      material,
      dimensions,
      production_time,
      description,
      images,
    },
  };
}

/**
 * Validates checkout order payload
 * Whitelists allowed fields, strips any client price/total
 */
export function validateOrderPayload(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Недійсні дані замовлення'], sanitized: {} };
  }

  const customer_name = sanitizeString(data.customer_name, 100);
  if (!customer_name || customer_name.length < 2) {
    errors.push("Вкажіть ваше ім'я та прізвище");
  }

  const customer_phone = sanitizeString(data.customer_phone, 30);
  if (!validatePhone(customer_phone)) {
    errors.push('Вкажіть коректний контактний номер телефону');
  }

  const customer_email = sanitizeString(data.customer_email, 100);
  if (customer_email && !validateEmail(customer_email)) {
    errors.push('Вкажіть коректну адресу електронної пошти');
  }

  const delivery_city = sanitizeString(data.delivery_city, 100);
  const delivery_address = sanitizeString(data.delivery_address, 200);
  const delivery_method = ['nova_poshta', 'ukrposhta', 'pickup'].includes(data.delivery_method)
    ? data.delivery_method
    : 'nova_poshta';
  const payment_method = ['card', 'cod', 'cash'].includes(data.payment_method)
    ? data.payment_method
    : 'card';
  const notes = sanitizeString(data.notes, 500);

  if (!Array.isArray(data.items) || data.items.length === 0) {
    errors.push('Кошик не може бути порожнім');
  } else if (data.items.length > 50) {
    errors.push('Забагато позицій у замовленні (максимум 50)');
  }

  const sanitizedItems = [];
  if (Array.isArray(data.items)) {
    for (const item of data.items) {
      if (!item || typeof item !== 'object') {
        errors.push('Некоректний елемент товару');
        break;
      }
      const id = sanitizeString(item.id || item.productId, 60);
      const quantity = validatePositiveInteger(item.quantity, 1, 50);
      if (!id || quantity === null) {
        errors.push('Некоректний товар або кількість у кошику (має бути цілим додатним числом)');
        break;
      }
      sanitizedItems.push({ id, quantity });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      customer_name,
      customer_phone,
      customer_email,
      delivery_city,
      delivery_address,
      delivery_method,
      payment_method,
      notes,
      items: sanitizedItems,
    },
  };
}

/**
 * Validates workshop booking payload
 */
export function validateWorkshopPayload(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Недійсні дані запису'], sanitized: {} };
  }

  const customer_name = sanitizeString(data.customer_name, 100);
  if (!customer_name || customer_name.length < 2) {
    errors.push("Вкажіть ваше ім'я");
  }

  const customer_phone = sanitizeString(data.customer_phone, 30);
  if (!validatePhone(customer_phone)) {
    errors.push('Вкажіть коректний номер телефону');
  }

  const customer_email = sanitizeString(data.customer_email, 100);
  if (customer_email && !validateEmail(customer_email)) {
    errors.push('Вкажіть коректну адресу електронної пошти');
  }

  const workshop_title = sanitizeString(data.workshop_title, 150);
  if (!workshop_title || workshop_title.length < 2) {
    errors.push('Оберіть або вкажіть назву майстер-класу');
  }

  const participants_count = validatePositiveInteger(
    data.participants_count !== undefined ? data.participants_count : 1,
    1,
    30
  ) || 1;

  const participant_age = sanitizeString(data.participant_age, 50) || 'Не вказано';
  const preferred_date = sanitizeString(data.preferred_date, 80) || 'За домовленістю';
  const preferred_time = sanitizeString(data.preferred_time, 50) || 'За домовленістю';
  const notes = sanitizeString(data.notes, 500);

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      customer_name,
      customer_phone,
      customer_email,
      workshop_title,
      participants_count,
      participant_age,
      preferred_date,
      preferred_time,
      notes,
    },
  };
}

/**
 * Validates custom order inquiry payload
 */
export function validateCustomOrderPayload(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Недійсні дані замовлення'], sanitized: {} };
  }

  const customer_name = sanitizeString(data.customer_name, 100);
  if (!customer_name || customer_name.length < 2) {
    errors.push("Вкажіть ваше ім'я");
  }

  const customer_phone = sanitizeString(data.customer_phone, 30);
  if (!validatePhone(customer_phone)) {
    errors.push('Вкажіть коректний контактний номер телефону');
  }

  const customer_email = sanitizeString(data.customer_email, 100);
  if (customer_email && !validateEmail(customer_email)) {
    errors.push('Вкажіть коректну адресу електронної пошти');
  }

  const category = sanitizeString(data.category, 100) || 'Індивідуальне замовлення';
  const budget = sanitizeString(data.budget, 100);
  const deadline = sanitizeString(data.deadline, 100);
  const description = sanitizeString(data.description, 1000);

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      customer_name,
      customer_phone,
      customer_email,
      category,
      budget,
      deadline,
      description,
    },
  };
}

/**
 * Validates space rental inquiry payload
 */
export function validateSpacePayload(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Недійсні дані заявки'], sanitized: {} };
  }

  const customer_name = sanitizeString(data.customer_name, 100);
  if (!customer_name || customer_name.length < 2) {
    errors.push("Вкажіть ваше ім'я");
  }

  const customer_phone = sanitizeString(data.customer_phone, 30);
  if (!validatePhone(customer_phone)) {
    errors.push('Вкажіть коректний контактний номер телефону');
  }

  const tariff = sanitizeString(data.tariff || data.event_type, 100) || 'Оренда простору';
  const event_date = sanitizeString(data.event_date || data.date, 50) || 'За домовленістю';
  const event_time = sanitizeString(data.event_time || data.time, 50) || 'За домовленістю';
  const duration_hours = validatePositiveInteger(data.duration_hours, 1, 24) || 2;
  const guests_count = validatePositiveInteger(data.guests_count || data.people_count, 1, 50) || 5;
  const notes = sanitizeString(data.notes, 500);

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      customer_name,
      customer_phone,
      tariff,
      event_date,
      event_time,
      duration_hours,
      guests_count,
      notes,
    },
  };
}

export const validateWorkshopBookingPayload = validateWorkshopPayload;
export const validateSpaceBookingPayload = validateSpacePayload;
