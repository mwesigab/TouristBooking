import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertCategorySchema, insertTourPackageSchema, insertBookingSchema, insertReviewSchema } from "@shared/schema";
import { ZodError } from "zod";
import passport from "./auth";
import { isAuthenticated, isAdmin } from "./auth";
import { hashSync } from "bcrypt";

export function registerRoutes(app: Express): Server {
  // Authentication routes
  app.post('/api/auth/login', passport.authenticate('local'), (req: Request, res: Response) => {
    res.json({ user: req.user });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.logout(() => {
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Modified signup route to hash password
  app.post('/api/auth/signup', async (req: Request, res: Response) => {
    try {
      console.log('Received user data:', req.body);
      const userData = insertUserSchema.parse(req.body);

      // Hash password before storing
      const hashedPassword = hashSync(userData.password, 10);
      const userToCreate = { ...userData, password: hashedPassword };

      console.log('Creating user with hashed password');
      const user = await storage.createUser(userToCreate);

      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
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

  // Protected routes - require authentication
  app.get('/api/auth/profile', isAuthenticated, (req: Request, res: Response) => {
    const { password, ...userWithoutPassword } = req.user as any;
    res.json(userWithoutPassword);
  });

  // Admin-only routes
  app.post('/api/categories', isAdmin, async (req: Request, res: Response) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.json(category);
    } catch (error) {
      res.status(400).json({ error: 'Invalid category data' });
    }
  });

  // Public routes
  app.get('/api/categories', async (_req: Request, res: Response) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.get('/api/categories/:id', async (req: Request, res: Response) => {
    const category = await storage.getCategory(Number(req.params.id));
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
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

  // Admin only routes for tour package management
  app.post('/api/tour-packages', isAdmin, async (req: Request, res: Response) => {
    try {
      const packageData = insertTourPackageSchema.parse(req.body);
      const package_ = await storage.createTourPackage(packageData);
      res.json(package_);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: 'Invalid tour package data', details: error.errors });
      } else {
        res.status(400).json({ error: 'Failed to create tour package' });
      }
    }
  });

  app.patch('/api/tour-packages/:id', isAdmin, async (req: Request, res: Response) => {
    try {
      const packageId = Number(req.params.id);
      const package_ = await storage.getTourPackage(packageId);

      if (!package_) {
        return res.status(404).json({ error: 'Tour package not found' });
      }

      const allowedUpdates = ['name', 'description', 'price', 'duration', 'location', 'maxParticipants', 'imageUrl'];
      const updates = Object.keys(req.body).filter(key => allowedUpdates.includes(key));

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      const updatedPackage = await storage.updateTourPackage(packageId, req.body);
      res.json(updatedPackage);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update tour package' });
    }
  });

  app.delete('/api/tour-packages/:id', isAdmin, async (req: Request, res: Response) => {
    try {
      const packageId = Number(req.params.id);
      const package_ = await storage.getTourPackage(packageId);

      if (!package_) {
        return res.status(404).json({ error: 'Tour package not found' });
      }

      // Check if there are any active bookings for this package
      const activeBookings = await storage.getActiveBookingsForPackage(packageId);
      if (activeBookings.length > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete tour package with active bookings',
          activeBookings: activeBookings.length
        });
      }

      await storage.deleteTourPackage(packageId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete tour package' });
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

  app.patch('/api/bookings/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const bookingId = Number(req.params.id);
      const booking = await storage.getBooking(bookingId);

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      // Only allow users to modify their own bookings (unless admin)
      if (booking.userId !== (req.user as any).id && (req.user as any).role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to modify this booking' });
      }

      const allowedUpdates = ['numberOfParticipants', 'startDate', 'status'];
      const updates = Object.keys(req.body).filter(key => allowedUpdates.includes(key));

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      // Additional validation for status changes
      if (req.body.status && !['pending', 'confirmed', 'cancelled'].includes(req.body.status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }

      const updatedBooking = await storage.updateBooking(bookingId, req.body);
      res.json(updatedBooking);
    } catch (error) {
      console.error('Booking update error:', error);
      res.status(500).json({ error: 'Failed to update booking' });
    }
  });

  app.delete('/api/bookings/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const bookingId = Number(req.params.id);
      const booking = await storage.getBooking(bookingId);

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      // Only allow users to delete their own bookings (unless admin)
      if (booking.userId !== (req.user as any).id && (req.user as any).role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to delete this booking' });
      }

      // Don't allow deletion of confirmed bookings
      if (booking.status === 'confirmed') {
        return res.status(400).json({ error: 'Cannot delete confirmed bookings' });
      }

      await storage.deleteBooking(bookingId);
      res.status(204).send();
    } catch (error) {
      console.error('Booking deletion error:', error);
      res.status(500).json({ error: 'Failed to delete booking' });
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