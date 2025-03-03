import { eq } from "drizzle-orm";
import { db } from "./db";
import {
  users, categories, tourPackages, bookings, reviews,
  type User, type InsertUser,
  type Category, type InsertCategory,
  type TourPackage, type InsertTourPackage,
  type Booking, type InsertBooking,
  type Review, type InsertReview
} from "@shared/schema";

// Update IStorage interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Category operations
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Tour Package operations
  getTourPackages(): Promise<TourPackage[]>;
  getTourPackage(id: number): Promise<TourPackage | undefined>;
  getTourPackagesByCategory(categoryId: number): Promise<TourPackage[]>;
  createTourPackage(tourPackage: InsertTourPackage): Promise<TourPackage>;
  updateTourPackage(id: number, updates: Partial<TourPackage>): Promise<TourPackage>;
  deleteTourPackage(id: number): Promise<void>;
  getActiveBookingsForPackage(packageId: number): Promise<Booking[]>;

  // Booking operations
  getBookings(): Promise<Booking[]>;
  getBooking(id: number): Promise<Booking | undefined>;
  getUserBookings(userId: number): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: number, status: string): Promise<Booking>;
  updateBooking(id: number, updates: Partial<Booking>): Promise<Booking>;
  deleteBooking(id: number): Promise<void>;

  // Review operations
  getReviews(): Promise<Review[]>;
  getReview(id: number): Promise<Review | undefined>;
  getPackageReviews(packageId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  // Tour Package operations
  async getTourPackages(): Promise<TourPackage[]> {
    return db.select().from(tourPackages);
  }

  async getTourPackage(id: number): Promise<TourPackage | undefined> {
    const [package_] = await db.select().from(tourPackages).where(eq(tourPackages.id, id));
    return package_;
  }

  async getTourPackagesByCategory(categoryId: number): Promise<TourPackage[]> {
    return db.select().from(tourPackages).where(eq(tourPackages.categoryId, categoryId));
  }

  async createTourPackage(tourPackage: InsertTourPackage): Promise<TourPackage> {
    const [newPackage] = await db.insert(tourPackages).values(tourPackage).returning();
    return newPackage;
  }

  async updateTourPackage(id: number, updates: Partial<TourPackage>): Promise<TourPackage> {
    const [updatedPackage] = await db
      .update(tourPackages)
      .set(updates)
      .where(eq(tourPackages.id, id))
      .returning();
    return updatedPackage;
  }

  async deleteTourPackage(id: number): Promise<void> {
    await db.delete(tourPackages).where(eq(tourPackages.id, id));
  }

  async getActiveBookingsForPackage(packageId: number): Promise<Booking[]> {
    return db
      .select()
      .from(bookings)
      .where(eq(bookings.packageId, packageId))
      .where(eq(bookings.status, 'confirmed'));
  }

  // Booking operations
  async getBookings(): Promise<Booking[]> {
    return db.select().from(bookings);
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async getUserBookings(userId: number): Promise<Booking[]> {
    return db.select().from(bookings).where(eq(bookings.userId, userId));
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db.insert(bookings).values(booking).returning();
    return newBooking;
  }

  async updateBookingStatus(id: number, status: string): Promise<Booking> {
    const [updatedBooking] = await db
      .update(bookings)
      .set({ status })
      .where(eq(bookings.id, id))
      .returning();
    return updatedBooking;
  }

  async updateBooking(id: number, updates: Partial<Booking>): Promise<Booking> {
    const [updatedBooking] = await db
      .update(bookings)
      .set(updates)
      .where(eq(bookings.id, id))
      .returning();
    return updatedBooking;
  }

  async deleteBooking(id: number): Promise<void> {
    await db
      .delete(bookings)
      .where(eq(bookings.id, id));
  }

  // Review operations
  async getReviews(): Promise<Review[]> {
    return db.select().from(reviews);
  }

  async getReview(id: number): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(eq(reviews.id, id));
    return review;
  }

  async getPackageReviews(packageId: number): Promise<Review[]> {
    return db.select().from(reviews).where(eq(reviews.packageId, packageId));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }
}

export const storage = new DatabaseStorage();