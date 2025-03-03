import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  fullName: text("full_name").notNull(),
  phoneNumber: text("phone_number"),
  role: text("role").notNull().default("customer"),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const tourPackages = pgTable("tour_packages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  duration: integer("duration").notNull(), // in days
  categoryId: integer("category_id").references(() => categories.id),
  location: text("location").notNull(),
  maxParticipants: integer("max_participants").notNull(),
  imageUrl: text("image_url"),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  packageId: integer("package_id").references(() => tourPackages.id),
  bookingDate: timestamp("booking_date").notNull().defaultNow(),
  startDate: timestamp("start_date").notNull(),
  numberOfParticipants: integer("number_of_participants").notNull(),
  totalPrice: doublePrecision("total_price").notNull(),
  status: text("status").notNull().default("pending"), // pending, confirmed, cancelled
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  packageId: integer("package_id").references(() => tourPackages.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  phoneNumber: true,
});

export const insertCategorySchema = createInsertSchema(categories);

export const insertTourPackageSchema = createInsertSchema(tourPackages).omit({
  id: true,
});

export const insertBookingSchema = createInsertSchema(bookings)
  .omit({
    id: true,
    bookingDate: true,
    status: true, // Remove status since it has a default value
  })
  .extend({
    startDate: z.preprocess((arg) => {
      if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
      return arg;
    }, z.date()),
    numberOfParticipants: z.number().int().positive(),
    totalPrice: z.number().positive(),
    userId: z.number().int().positive(),
    packageId: z.number().int().positive()
  });

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
}).extend({
  rating: z.number().int().min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5"),
  userId: z.number().int().positive("User ID must be a positive number"),
  packageId: z.number().int().positive("Package ID must be a positive number"),
  comment: z.string().min(1, "Comment is required").max(500, "Comment must not exceed 500 characters")
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertTourPackage = z.infer<typeof insertTourPackageSchema>;
export type TourPackage = typeof tourPackages.$inferSelect;

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;