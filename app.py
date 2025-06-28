from flask import Flask, render_template, request, redirect, url_for, flash, session
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from flask_mail import Mail, Message
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, TextAreaField, SelectField, SubmitField
from wtforms.validators import DataRequired, Email, Length, EqualTo
from werkzeug.security import generate_password_hash, check_password_hash
import os
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///keepalleytrash.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Email configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')

db = SQLAlchemy(app)
mail = Mail(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Database Models
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    neighborhood = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_admin = db.Column(db.Boolean, default=False)
    
    posts = db.relationship('Post', backref='author', lazy=True)
    suggestions = db.relationship('Suggestion', backref='author', lazy=True)

class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    category = db.Column(db.String(50), default='general')

class Suggestion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(20), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

class Contact(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    subject = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Subscriber(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    subscribed_at = db.Column(db.DateTime, default=datetime.utcnow)

# Forms
class RegistrationForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=3, max=20)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=6)])
    confirm_password = PasswordField('Confirm Password', validators=[DataRequired(), EqualTo('password')])
    neighborhood = StringField('Neighborhood')
    submit = SubmitField('Register')

class LoginForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired()])
    submit = SubmitField('Login')

class PostForm(FlaskForm):
    title = StringField('Title', validators=[DataRequired()])
    content = TextAreaField('Content', validators=[DataRequired()])
    category = SelectField('Category', choices=[
        ('general', 'General'),
        ('cleanup', 'Cleanup Event'),
        ('issue', 'Issue Report'),
        ('announcement', 'Announcement')
    ])
    submit = SubmitField('Post')

class SuggestionForm(FlaskForm):
    title = StringField('Title', validators=[DataRequired()])
    description = TextAreaField('Description', validators=[DataRequired()])
    category = SelectField('Category', choices=[
        ('cleanup', 'Cleanup Initiative'),
        ('safety', 'Safety Improvement'),
        ('community', 'Community Event'),
        ('other', 'Other')
    ])
    submit = SubmitField('Submit Suggestion')

class ContactForm(FlaskForm):
    name = StringField('Name', validators=[DataRequired()])
    email = StringField('Email', validators=[DataRequired(), Email()])
    subject = StringField('Subject', validators=[DataRequired()])
    message = TextAreaField('Message', validators=[DataRequired()])
    submit = SubmitField('Send Message')

class SubscribeForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email()])
    submit = SubmitField('Subscribe')

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/welcome')
def welcome():
    return render_template('welcome.html')

@app.route('/home')
def home():
    recent_posts = Post.query.order_by(Post.created_at.desc()).limit(5).all()
    return render_template('home.html', posts=recent_posts)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    
    form = RegistrationForm()
    if form.validate_on_submit():
        hashed_password = generate_password_hash(form.password.data)
        user = User(
            username=form.username.data,
            email=form.email.data,
            password_hash=hashed_password,
            neighborhood=form.neighborhood.data
        )
        db.session.add(user)
        db.session.commit()
        flash('Account created successfully! You can now log in.', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html', form=form)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user and check_password_hash(user.password_hash, form.password.data):
            login_user(user)
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('home'))
        else:
            flash('Login failed. Please check your email and password.', 'danger')
    
    return render_template('login.html', form=form)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('home'))

@app.route('/community')
def community():
    posts = Post.query.order_by(Post.created_at.desc()).all()
    return render_template('community.html', posts=posts)

@app.route('/submit', methods=['GET', 'POST'])
@login_required
def submit():
    form = PostForm()
    if form.validate_on_submit():
        post = Post(
            title=form.title.data,
            content=form.content.data,
            category=form.category.data,
            author=current_user
        )
        db.session.add(post)
        db.session.commit()
        flash('Post created successfully!', 'success')
        return redirect(url_for('community'))
    
    return render_template('submit.html', form=form)

@app.route('/suggestions')
def suggestions():
    suggestions = Suggestion.query.order_by(Suggestion.created_at.desc()).all()
    return render_template('suggestions.html', suggestions=suggestions)

@app.route('/submit_suggestion', methods=['GET', 'POST'])
@login_required
def submit_suggestion():
    form = SuggestionForm()
    if form.validate_on_submit():
        suggestion = Suggestion(
            title=form.title.data,
            description=form.description.data,
            category=form.category.data,
            author=current_user
        )
        db.session.add(suggestion)
        db.session.commit()
        flash('Suggestion submitted successfully!', 'success')
        return redirect(url_for('suggestions'))
    
    return render_template('submit_suggestion.html', form=form)

@app.route('/contact', methods=['GET', 'POST'])
def contact():
    form = ContactForm()
    if form.validate_on_submit():
        contact = Contact(
            name=form.name.data,
            email=form.email.data,
            subject=form.subject.data,
            message=form.message.data
        )
        db.session.add(contact)
        db.session.commit()
        
        # Send email notification (if configured)
        if app.config['MAIL_USERNAME']:
            try:
                msg = Message(
                    f'New Contact Form Submission: {form.subject.data}',
                    sender=form.email.data,
                    recipients=[app.config['MAIL_USERNAME']]
                )
                msg.body = f"""
                Name: {form.name.data}
                Email: {form.email.data}
                Subject: {form.subject.data}
                Message: {form.message.data}
                """
                mail.send(msg)
            except Exception as e:
                print(f"Email sending failed: {e}")
        
        flash('Message sent successfully! We will get back to you soon.', 'success')
        return redirect(url_for('contact'))
    
    return render_template('contact.html', form=form)

@app.route('/subscribe', methods=['GET', 'POST'])
def subscribe():
    form = SubscribeForm()
    if form.validate_on_submit():
        # Check if already subscribed
        existing = Subscriber.query.filter_by(email=form.email.data).first()
        if existing:
            flash('You are already subscribed!', 'info')
        else:
            subscriber = Subscriber(email=form.email.data)
            db.session.add(subscriber)
            db.session.commit()
            flash('Successfully subscribed to our newsletter!', 'success')
        return redirect(url_for('home'))
    
    return render_template('subscribe.html', form=form)

@app.route('/guidelines')
def guidelines():
    return render_template('guidelines.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/profile')
@login_required
def profile():
    return render_template('user/profile.html')

# Admin routes
@app.route('/admin/dashboard')
@login_required
def admin_dashboard():
    if not current_user.is_admin:
        flash('Access denied. Admin privileges required.', 'danger')
        return redirect(url_for('home'))
    
    users_count = User.query.count()
    posts_count = Post.query.count()
    suggestions_count = Suggestion.query.count()
    contacts_count = Contact.query.count()
    
    return render_template('admin/dashboard.html', 
                         users_count=users_count,
                         posts_count=posts_count,
                         suggestions_count=suggestions_count,
                         contacts_count=contacts_count)

@app.route('/admin/posts')
@login_required
def admin_posts():
    if not current_user.is_admin:
        flash('Access denied. Admin privileges required.', 'danger')
        return redirect(url_for('home'))
    
    posts = Post.query.order_by(Post.created_at.desc()).all()
    return render_template('admin/posts.html', posts=posts)

# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    return render_template('errors/error.html', error_code=404, error_message="Page not found"), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return render_template('errors/error.html', error_code=500, error_message="Internal server error"), 500

# Create database tables
def create_tables():
    with app.app_context():
        db.create_all()
        
        # Create admin user if none exists
        admin = User.query.filter_by(is_admin=True).first()
        if not admin:
            admin = User(
                username='admin',
                email='admin@keepalleytrash.com',
                password_hash=generate_password_hash('admin123'),
                is_admin=True
            )
            db.session.add(admin)
            db.session.commit()

if __name__ == '__main__':
    create_tables()
    app.run(debug=True, port=8080) 