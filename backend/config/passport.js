import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Yahan aap apna User model use karke check kar sakte hain
      // Abhi ke liye hum sirf profile data bhej rahe hain
      const user = {
        id: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        image: profile.photos[0].value
      };
      return done(null, { user, token: "generated-jwt-token" });
    } catch (err) {
      return done(err, null);
    }
  }
));

export default passport;