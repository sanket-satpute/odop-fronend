import { Component, OnInit } from '@angular/core';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  category: string;
  author: string;
  authorImage: string;
  date: Date;
  readTime: number;
  tags: string[];
  featured: boolean;
}

@Component({
  selector: 'app-blog-page',
  templateUrl: './blog-page.component.html',
  styleUrls: ['./blog-page.component.css']
})
export class BlogPageComponent implements OnInit {
  searchQuery: string = '';
  selectedCategory: string = 'all';

  categories = [
    { id: 'all', name: 'All Stories', icon: 'fas fa-th-large' },
    { id: 'artisan', name: 'Artisan Stories', icon: 'fas fa-hands' },
    { id: 'products', name: 'Product Features', icon: 'fas fa-gem' },
    { id: 'culture', name: 'Cultural Heritage', icon: 'fas fa-landmark' },
    { id: 'tips', name: 'Shopping Tips', icon: 'fas fa-lightbulb' },
    { id: 'news', name: 'ODOP News', icon: 'fas fa-newspaper' }
  ];

  blogPosts: BlogPost[] = [
    {
      id: 1,
      title: 'The Rich Heritage of Banarasi Silk Weaving',
      excerpt: 'Discover the centuries-old tradition of Banarasi silk weaving and the skilled artisans who keep this craft alive.',
      content: '',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800',
      category: 'artisan',
      author: 'Priya Sharma',
      authorImage: 'https://randomuser.me/api/portraits/women/44.jpg',
      date: new Date('2025-01-10'),
      readTime: 8,
      tags: ['Silk', 'Weaving', 'Varanasi', 'Heritage'],
      featured: true
    },
    {
      id: 2,
      title: 'GI Tags: Protecting Traditional Products',
      excerpt: 'Learn how Geographical Indication tags help preserve and promote authentic Indian handicrafts and products.',
      content: '',
      image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800',
      category: 'news',
      author: 'Rahul Verma',
      authorImage: 'https://randomuser.me/api/portraits/men/32.jpg',
      date: new Date('2025-01-08'),
      readTime: 6,
      tags: ['GI Tags', 'Policy', 'Protection', 'Authenticity'],
      featured: true
    },
    {
      id: 3,
      title: 'Madhubani Art: From Village Walls to Global Recognition',
      excerpt: 'Explore the journey of Madhubani painting from rural Bihar to international art galleries and home decor.',
      content: '',
      image: 'https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?w=800',
      category: 'artisan',
      author: 'Anjali Devi',
      authorImage: 'https://randomuser.me/api/portraits/women/68.jpg',
      date: new Date('2025-01-05'),
      readTime: 7,
      tags: ['Madhubani', 'Art', 'Bihar', 'Painting'],
      featured: false
    },
    {
      id: 4,
      title: 'How to Identify Authentic Handloom Products',
      excerpt: 'A comprehensive guide to distinguishing genuine handloom products from machine-made imitations.',
      content: '',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
      category: 'tips',
      author: 'Vikram Singh',
      authorImage: 'https://randomuser.me/api/portraits/men/75.jpg',
      date: new Date('2025-01-03'),
      readTime: 5,
      tags: ['Handloom', 'Tips', 'Authentication', 'Shopping'],
      featured: false
    },
    {
      id: 5,
      title: 'The Revival of Channapatna Toys',
      excerpt: 'Karnataka famous wooden toys are making a comeback thanks to sustainable practices and modern designs.',
      content: '',
      image: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800',
      category: 'products',
      author: 'Meera Rao',
      authorImage: 'https://randomuser.me/api/portraits/women/89.jpg',
      date: new Date('2024-12-28'),
      readTime: 6,
      tags: ['Toys', 'Karnataka', 'Wood Craft', 'Sustainable'],
      featured: false
    },
    {
      id: 6,
      title: 'Blue Pottery of Jaipur: A Persian Legacy',
      excerpt: 'Trace the fascinating history of Jaipur iconic blue pottery and its unique Persian-influenced techniques.',
      content: '',
      image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800',
      category: 'culture',
      author: 'Arjun Mehra',
      authorImage: 'https://randomuser.me/api/portraits/men/45.jpg',
      date: new Date('2024-12-25'),
      readTime: 9,
      tags: ['Pottery', 'Jaipur', 'Rajasthan', 'Persian'],
      featured: false
    },
    {
      id: 7,
      title: 'Supporting Artisan Communities Through ODOP',
      excerpt: 'How the One District One Product initiative is transforming lives and livelihoods across rural India.',
      content: '',
      image: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800',
      category: 'news',
      author: 'Sneha Gupta',
      authorImage: 'https://randomuser.me/api/portraits/women/22.jpg',
      date: new Date('2024-12-20'),
      readTime: 7,
      tags: ['ODOP', 'Community', 'Livelihood', 'Impact'],
      featured: false
    },
    {
      id: 8,
      title: 'Pashmina: The Diamond Fiber of Kashmir',
      excerpt: 'Delve into the world of authentic Kashmiri Pashmina and learn what makes it the world finest wool.',
      content: '',
      image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800',
      category: 'products',
      author: 'Faisal Khan',
      authorImage: 'https://randomuser.me/api/portraits/men/62.jpg',
      date: new Date('2024-12-15'),
      readTime: 8,
      tags: ['Pashmina', 'Kashmir', 'Wool', 'Luxury'],
      featured: false
    }
  ];

  get filteredPosts(): BlogPost[] {
    return this.blogPosts.filter(post => {
      const matchesCategory = this.selectedCategory === 'all' || post.category === this.selectedCategory;
      const matchesSearch = !this.searchQuery || 
        post.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(this.searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }

  get featuredPosts(): BlogPost[] {
    return this.blogPosts.filter(post => post.featured);
  }

  ngOnInit(): void {}

  filterByCategory(categoryId: string): void {
    this.selectedCategory = categoryId;
  }

  getCategoryName(categoryId: string): string {
    const cat = this.categories.find(c => c.id === categoryId);
    return cat ? cat.name : categoryId;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
