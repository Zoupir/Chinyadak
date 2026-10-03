import 'dotenv/config';
import { pool } from '../src/server/db';
import { PRODUCTS, BRANDS, ARTICLES, INITIAL_ORDERS } from '../src/data/mockData';

const statusToPayment = (status: string) =>
  ['paid', 'processing', 'ready_to_ship', 'shipped', 'delivered'].includes(status) ? 'paid' : 'unpaid';

const main = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Refresh only demo catalog entities. This script intentionally does NOT touch site settings.
    for (const brand of BRANDS) {
      await connection.execute(
        `INSERT INTO vehicle_brands (id, slug, name_fa, name_en, data_json, is_active)
         VALUES (?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE
           slug = VALUES(slug),
           name_fa = VALUES(name_fa),
           name_en = VALUES(name_en),
           data_json = VALUES(data_json),
           is_active = 1,
           updated_at = NOW()`,
        [brand.id, brand.slug, brand.nameFa, brand.nameEn || null, JSON.stringify(brand)]
      );
    }

    for (const product of PRODUCTS) {
      await connection.execute(
        `INSERT INTO products
          (id, sku, slug, name_fa, name_en, oem_number, part_number, category_slug,
           manufacturer, grade, price, discount_price, stock, status, images_json,
           specs_json, fitments_json, data_json, short_description, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           sku = VALUES(sku),
           slug = VALUES(slug),
           name_fa = VALUES(name_fa),
           name_en = VALUES(name_en),
           oem_number = VALUES(oem_number),
           part_number = VALUES(part_number),
           category_slug = VALUES(category_slug),
           manufacturer = VALUES(manufacturer),
           grade = VALUES(grade),
           price = VALUES(price),
           discount_price = VALUES(discount_price),
           stock = VALUES(stock),
           status = 'active',
           images_json = VALUES(images_json),
           specs_json = VALUES(specs_json),
           fitments_json = VALUES(fitments_json),
           data_json = VALUES(data_json),
           short_description = VALUES(short_description),
           description = VALUES(description),
           updated_at = NOW()`,
        [
          product.id,
          product.sku,
          product.slug,
          product.nameFa,
          product.nameEn || null,
          product.oemNumber || null,
          product.partNumber || null,
          product.categorySlug,
          product.brandManufacturer || null,
          product.grade || null,
          product.price,
          product.discountPrice ?? null,
          product.stock,
          JSON.stringify(product.images || []),
          JSON.stringify(product.technicalSpecs || {}),
          JSON.stringify(product.fitments || []),
          JSON.stringify(product),
          product.shortDescription || null,
          product.description || null
        ]
      );
    }

    for (const article of ARTICLES) {
      await connection.execute(
        `INSERT INTO articles (id, slug, title, category_id, data_json, is_active)
         VALUES (?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE
           slug = VALUES(slug),
           title = VALUES(title),
           category_id = VALUES(category_id),
           data_json = VALUES(data_json),
           is_active = 1,
           updated_at = NOW()`,
        [article.id, article.slug, article.title, article.categoryId || null, JSON.stringify(article)]
      );
    }

    for (const order of INITIAL_ORDERS) {
      await connection.execute(
        `INSERT INTO orders
          (id, order_number, customer_id, status, customer_snapshot, shipping_snapshot,
           payment_method, subtotal, discount_amount, shipping_fee, total, payment_status,
           payment_reference, paid_at, tracking_code, created_at)
         VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY))
         ON DUPLICATE KEY UPDATE
           status = VALUES(status),
           customer_snapshot = VALUES(customer_snapshot),
           shipping_snapshot = VALUES(shipping_snapshot),
           payment_method = VALUES(payment_method),
           subtotal = VALUES(subtotal),
           discount_amount = VALUES(discount_amount),
           shipping_fee = VALUES(shipping_fee),
           total = VALUES(total),
           payment_status = VALUES(payment_status),
           payment_reference = VALUES(payment_reference),
           paid_at = VALUES(paid_at),
           tracking_code = VALUES(tracking_code),
           updated_at = NOW()`,
        [
          order.id,
          order.orderNumber,
          order.status,
          JSON.stringify(order.customer),
          JSON.stringify(order.shippingMethod),
          order.paymentMethod.id,
          order.subtotal,
          order.discountAmount,
          order.shippingFee,
          order.total,
          statusToPayment(order.status),
          'DEMO-' + order.orderNumber,
          statusToPayment(order.status) === 'paid' ? new Date() : null,
          order.trackingPostCode || null,
          order.id.endsWith('29') ? 2 : 8
        ]
      );

      await connection.execute('DELETE FROM order_items WHERE order_id = ?', [order.id]);

      for (const item of order.items) {
        await connection.execute(
          `INSERT INTO order_items
            (order_id, product_id, sku, product_name, oem_number, unit_price, quantity, line_total, metadata_json)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            order.id,
            item.productId || null,
            null,
            item.productName,
            item.oemNumber || null,
            item.price,
            item.quantity,
            item.price * item.quantity,
            JSON.stringify({
              image: item.image,
              grade: item.grade,
              vehicleInfo: item.vehicleInfo || ''
            })
          ]
        );
      }
    }

    await connection.commit();
    console.log(`Demo data ready: ${BRANDS.length} brands, ${PRODUCTS.length} products, ${ARTICLES.length} articles, ${INITIAL_ORDERS.length} orders.`);
    console.log('Site settings were not changed.');
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
