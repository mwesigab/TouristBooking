import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertCategorySchema, insertTourPackageSchema, insertBookingSchema, insertReviewSchema } from "@shared/schema";
import { ZodError } from "zod";

export function registerRoutes(app: Express): Server {
  // User routes
  app.post('/api/users/signup', async (req: Request, res: Response) => {
    try {
      console.log('Received user data:', req.body);
      const userData = insertUserSchema.parse(req.body);
      console.log('Parsed user data:', userData);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      console.error('User creation error:', error);
      if (error instanceof ZodError) {
        console.error('ZodError details:', error.errors);
        res.status(400).json({ error: 'Invalid user data', details: error.errors });
      } else {
        res.status(400).json({ error: 'Invalid user data' });
      }
    }
  });

  // Category routes
  app.get('/api/categories', async (_req: Request, res: Response) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.get('/api/categories/:id', async (req: Request, res: Response) => {
    const category = await storage.getCategory(Number(req.params.id));
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  });

  app.post('/api/categories', async (req: Request, res: Response) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.json(category);
    } catch (error) {
      res.status(400).json({ error: 'Invalid category data' });
    }
  });

  // Tour Package routes
  app.get('/api/tour-packages', async (_req: Request, res: Response) => {
    const packages = await storage.getTourPackages();
    res.json(packages);
  });

  app.get('/api/tour-packages/:id', async (req: Request, res: Response) => {
    const package_ = await storage.getTourPackage(Number(req.params.id));
    if (!package_) return res.status(404).json({ error: 'Tour package not found' });
    res.json(package_);
  });

  app.get('/api/categories/:categoryId/tour-packages', async (req: Request, res: Response) => {
    const packages = await storage.getTourPackagesByCategory(Number(req.params.categoryId));
    res.json(packages);
  });

  app.post('/api/tour-packages', async (req: Request, res: Response) => {
    try {
      const packageData = insertTourPackageSchema.parse(req.body);
      const package_ = await storage.createTourPackage(packageData);
      res.json(package_);
    } catch (error) {
      res.status(400).json({ error: 'Invalid tour package data' });
    }
  });

  // Booking routes
  app.get('/api/bookings', async (_req: Request, res: Response) => {
    const bookings = await storage.getBookings();
    res.json(bookings);
  });

  app.get('/api/bookings/:id', async (req: Request, res: Response) => {
    const booking = await storage.getBooking(Number(req.params.id));
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  });

  app.get('/api/users/:userId/bookings', async (req: Request, res: Response) => {
    const bookings = await storage.getUserBookings(Number(req.params.userId));
    res.json(bookings);
  });

  app.post('/api/bookings', async (req: Request, res: Response) => {
    try {
      console.log('Received booking data:', JSON.stringify(req.body, null, 2));
      const bookingData = insertBookingSchema.parse(req.body);
      console.log('Parsed booking data:', JSON.stringify(bookingData, null, 2));
      const booking = await storage.createBooking(bookingData);
      res.json(booking);
    } catch (error) {
      console.error('Booking creation error:', error);
      if (error instanceof ZodError) {
        const zodErrors = JSON.stringify(error.errors, null, 2);
        console.error('ZodError details:', zodErrors);
        res.status(400).json({ error: 'Invalid booking data', details: error.errors });
      } else {
        const errorDetails = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error details:', errorDetails);
        res.status(400).json({ error: 'Invalid booking data', details: errorDetails });
      }
    }
  });

  app.patch('/api/bookings/:id/status', async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      const booking = await storage.updateBookingStatus(Number(req.params.id), status);
      res.json(booking);
    } catch (error) {
      res.status(400).json({ error: 'Failed to update booking status' });
    }
  });

  // Review routes
  app.get('/api/reviews', async (_req: Request, res: Response) => {
    const reviews = await storage.getReviews();
    res.json(reviews);
  });

  app.get('/api/reviews/:id', async (req: Request, res: Response) => {
    const review = await storage.getReview(Number(req.params.id));
    if (!review) return res.status(404).json({ error: 'Review not found' });
    res.json(review);
  });

  app.get('/api/tour-packages/:packageId/reviews', async (req: Request, res: Response) => {
    const reviews = await storage.getPackageReviews(Number(req.params.packageId));
    res.json(reviews);
  });

  app.post('/api/reviews', async (req: Request, res: Response) => {
    try {
      console.log('Received review data:', JSON.stringify(req.body, null, 2));
      const validationResult = insertReviewSchema.safeParse(req.body);

      if (!validationResult.success) {
        console.error('Validation failed:', JSON.stringify(validationResult.error.errors, null, 2));
        return res.status(400).json({
          error: 'Invalid review data',
          details: validationResult.error.errors
        });
      }

      // Additional validation check
      if (validationResult.data.rating < 1 || validationResult.data.rating > 5) {
        return res.status(400).json({
          error: 'Invalid review data',
          details: [{
            code: 'custom',
            path: ['rating'],
            message: 'Rating must be between 1 and 5'
          }]
        });
      }

      const review = await storage.createReview(validationResult.data);
      res.json(review);
    } catch (error) {
      console.error('Review creation error:', error);
      const errorDetails = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to create review', details: errorDetails });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}