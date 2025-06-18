from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from datetime import datetime
import os
from werkzeug.security import generate_password_hash, check_password_hash
from flask_mail import Mail, Message

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///keepalleytrash.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Email configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'  # You'll need to update this with your email provider
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.environ.get('EMAIL_USER')  # Set this in your environment
app.config['MAIL_PASSWORD'] = os.environ.get('EMAIL_PASSWORD')  # Set this in your environment

db = SQLAlchemy(app)
mail = Mail(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Models
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    neighborhood = db.Column(db.String(100))
    is_admin = db.Column(db.Boolean, default=False)
    posts = db.relationship('Post', backref='author', lazy=True)
    subscriptions = db.relationship('Subscription', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Subscription(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    neighborhood = db.Column(db.String(100))
    is_active = db.Column(db.Boolean, default=True)
    date_subscribed = db.Column(db.DateTime, default=datetime.utcnow)
    preferences = db.Column(db.String(200))  # JSON string for notification preferences

class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)
    date_posted = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    category = db.Column(db.String(50))  # e.g., 'update', 'event', 'alert'
    is_published = db.Column(db.Boolean, default=True)
    is_featured = db.Column(db.Boolean, default=False)
    event_date = db.Column(db.DateTime, nullable=True)  # For event posts
    location = db.Column(db.String(200), nullable=True)  # For event posts

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Routes
@app.route('/')
def home():
    featured_posts = Post.query.filter_by(is_featured=True, is_published=True).order_by(Post.date_posted.desc()).limit(3).all()
    return render_template('home.html', posts=featured_posts)

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/community')
def community():
    posts = Post.query.order_by(Post.date_posted.desc()).all()
    return render_template('community.html', posts=posts)

@app.route('/guidelines')
def guidelines():
    return render_template('guidelines.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Add login logic here
        pass
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        neighborhood = request.form.get('neighborhood')

        # Basic validation
        if not username or not email or not password:
            flash('Please fill out all required fields.', 'danger')
            return render_template('register.html')

        # Check if username or email already exists
        if User.query.filter_by(username=username).first():
            flash('Username already taken.', 'danger')
            return render_template('register.html')
        if User.query.filter_by(email=email).first():
            flash('Email already registered.', 'danger')
            return render_template('register.html')

        # Create new user
        user = User(
            username=username,
            email=email,
            neighborhood=neighborhood
        )
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        login_user(user)
        flash('Registration successful! Welcome to Keep Alley Trash.', 'success')
        return redirect(url_for('home'))
    return render_template('register.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('home'))

@app.route('/subscribe', methods=['GET', 'POST'])
def subscribe():
    if request.method == 'POST':
        email = request.form.get('email')
        neighborhood = request.form.get('neighborhood')
        
        if not email:
            flash('Email is required', 'danger')
            return redirect(url_for('subscribe'))
        
        # Check if email already exists
        existing = Subscription.query.filter_by(email=email).first()
        if existing:
            if not existing.is_active:
                existing.is_active = True
                db.session.commit()
                flash('Welcome back! Your subscription has been reactivated.', 'success')
            else:
                flash('You are already subscribed!', 'info')
            return redirect(url_for('home'))
        
        # Create new subscription
        subscription = Subscription(
            email=email,
            neighborhood=neighborhood,
            is_active=True
        )
        
        try:
            db.session.add(subscription)
            db.session.commit()
            flash('Thank you for subscribing! You will receive updates about alley collection services.', 'success')
            
            # Send welcome email
            msg = Message(
                'Welcome to Keep Alley Trash Updates',
                sender=app.config['MAIL_USERNAME'],
                recipients=[email]
            )
            msg.body = f'''Welcome to Keep Alley Trash Updates!

Thank you for subscribing to receive updates about alley collection services in Dallas.

You will receive:
- Important updates about alley collection services
- Community event notifications
- Maintenance reminders
- Ways to get involved

To unsubscribe, simply reply to this email with "UNSUBSCRIBE" in the subject line.

Best regards,
Keep Alley Trash Team
'''
            mail.send(msg)
            
        except Exception as e:
            db.session.rollback()
            flash('An error occurred. Please try again.', 'danger')
            
        return redirect(url_for('home'))
        
    return render_template('subscribe.html')

@app.route('/unsubscribe/<email>')
def unsubscribe(email):
    subscription = Subscription.query.filter_by(email=email).first()
    if subscription:
        subscription.is_active = False
        db.session.commit()
        flash('You have been unsubscribed from our updates.', 'info')
    else:
        flash('Subscription not found.', 'danger')
    return redirect(url_for('home'))

@app.route('/admin/posts', methods=['GET', 'POST'])
@login_required
def manage_posts():
    if not current_user.is_admin:
        flash('Access denied.', 'danger')
        return redirect(url_for('home'))
        
    if request.method == 'POST':
        title = request.form.get('title')
        content = request.form.get('content')
        category = request.form.get('category')
        is_featured = bool(request.form.get('is_featured'))
        event_date = request.form.get('event_date')
        location = request.form.get('location')
        
        post = Post(
            title=title,
            content=content,
            category=category,
            is_featured=is_featured,
            user_id=current_user.id,
            event_date=datetime.strptime(event_date, '%Y-%m-%d') if event_date else None,
            location=location
        )
        
        try:
            db.session.add(post)
            db.session.commit()
            
            # Send email to all active subscribers
            subscribers = Subscription.query.filter_by(is_active=True).all()
            if subscribers:
                msg = Message(
                    f'New Update: {title}',
                    sender=app.config['MAIL_USERNAME'],
                    recipients=[s.email for s in subscribers]
                )
                msg.body = f'''New Update from Keep Alley Trash:

{title}

{content}

To unsubscribe, visit: {url_for('unsubscribe', email='{email}', _external=True)}
'''
                mail.send(msg)
            
            flash('Post created and subscribers notified!', 'success')
        except Exception as e:
            db.session.rollback()
            flash('Error creating post.', 'danger')
            
    posts = Post.query.order_by(Post.date_posted.desc()).all()
    return render_template('admin/posts.html', posts=posts)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=8080, debug=True) 