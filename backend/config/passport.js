import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import dotenv from 'dotenv';
import { Strategy as FortyTwoStrategy } from 'passport-42';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { findOrCreateOAuthUser } from '../models/user.js';

dotenv.config();

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      return done(null, payload);
    } catch (error) {
      return done(error, false);
    }
  })
);

passport.use('42', new FortyTwoStrategy({
  clientID: process.env.OAUTH_42_CLIENT_ID,
  clientSecret: process.env.OAUTH_42_CLIENT_SECRET,
  callbackURL: process.env.OAUTH_42_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const user = await findOrCreateOAuthUser('42', profile.id.toString(), {
      email: profile.emails[0]?.value,
      username: profile.login || profile.emails[0]?.value.split('@')[0],
      first_name: profile.name?.givenName,
      last_name: profile.name?.familyName,
    });
    return done(null, user);
  } catch (error) {
    return done(error, false);
  }
}));

passport.use('google', new GoogleStrategy({
  clientID: process.env.OAUTH_GOOGLE_CLIENT_ID,
  clientSecret: process.env.OAUTH_GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.OAUTH_GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const user = await findOrCreateOAuthUser('google', profile.id.toString(), {
      email: profile.emails[0]?.value,
      username: profile.emails[0]?.value.split('@')[0],
      first_name: profile.name?.givenName,
      last_name: profile.name?.familyName,
    });
    return done(null, user);
  } catch (error) {
    return done(error, false);
  }
}));

export default passport;
